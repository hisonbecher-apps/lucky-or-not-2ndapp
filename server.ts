import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3001;

// State
const onlineUsers = new Map<string, { id: string; name: string; socketId: string }>();
const waitingQueue: string[] = [];
const activeGames = new Map<string, any>();
const pendingBotEvents = new Map<string, any[]>(); // Keyed by user name

const BOT_NAMES = ["Blondie8", "Mydoe8", "Ziverov8", "Matalay8", "Diamond8", "Huson8", "Hison8", "Angel8", "Maniac8", "Engineer8", "Nadir8", "Yakup8", "mehmet8", "ahmet8", "H_Efe8", "Azra8", "Elif8", "Beyza8", "Busra8"];
BOT_NAMES.forEach(name => {
  const botId = `bot_${name}`;
  onlineUsers.set(botId, { id: botId, name: name, socketId: botId });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userData: { id: string; name: string }) => {
    onlineUsers.set(socket.id, { ...userData, socketId: socket.id });
    io.emit("online_users_count", onlineUsers.size);

    // Deliver any pending bot events that happened during navigation
    const pendings = pendingBotEvents.get(userData.name);
    if (pendings && pendings.length > 0) {
      console.log(`Delivering ${pendings.length} pending events to ${userData.name}`);
      pendings.forEach(p => {
        if (p.gameId) socket.join(p.gameId);
        socket.emit(p.event, p.data);
      });
      pendingBotEvents.delete(userData.name);
    }
  });

  socket.on("get_online_users", () => {
    const users = Array.from(onlineUsers.values())
      .filter(u => u.socketId !== socket.id)
      .map(u => ({ id: u.id, name: u.name }));
    
    console.log(`Sending online users list to ${socket.id}. Count: ${users.length} (including bots)`);
    socket.emit("online_users_list", users);
  });

  const sendBotEvent = (targetSocketId: string, event: string, data: any, delay: number = 1000, gameId?: string) => {
    setTimeout(() => {
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        if (gameId) targetSocket.join(gameId);
        console.log(`Delivering bot event ${event} to ${targetSocketId}`);
        targetSocket.emit(event, data);
      }
    }, delay);
  };

  socket.on("challenge_user", (targetName: string) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    const targetUser = Array.from(onlineUsers.values()).find(u => u.name.toLowerCase() === targetName.toLowerCase());
    
    if (targetUser && targetUser.socketId.startsWith('bot_')) {
      const gameId = `game_${socket.id}_${targetUser.socketId}`;
      const gameData = {
        players: [{ ...user, choice: null, score: 0, socketId: socket.id }, { ...targetUser, choice: null, score: 0, socketId: targetUser.socketId }],
        round: 1, totalRounds: 3
      };
      activeGames.set(gameId, gameData);
      socket.join(gameId);
      
      socket.emit("bot_challenge_pending");
      socket.emit("challenge_sent", { to: targetUser.name });
      sendBotEvent(socket.id, "match_found", { gameId, opponent: targetUser.name, players: gameData.players, isHost: true, isRandom: false }, 1000, gameId);
    } else if (targetUser) {
      io.to(targetUser.socketId).emit("receive_challenge", { from: user.name, fromSocketId: socket.id });
      socket.emit("challenge_sent", { to: targetUser.name });
    } else {
      socket.emit("user_not_found");
    }
  });

  const handleBotInvite = (gameType: string, gameId: string, targetUser: any, user: any) => {
    socket.emit("invite_sent", { to: targetUser.name, targetSocketId: targetUser.socketId });
    socket.emit("bot_challenge_pending");

    const players = [{ socketId: socket.id, name: user.name }, { socketId: targetUser.socketId, name: targetUser.name }];
    let eventName = "";
    let eventData: any = { gameId, isHost: true, isRandom: false };

    if (gameType === 'short_straw') {
      const straws = [];
      const shortIndex = Math.floor(Math.random() * 7);
      for (let i = 0; i < 7; i++) straws.push({ id: i + 1, isShort: i === shortIndex, isPulled: false });
      const gameData = { players: players.map((p, i) => ({ ...p, order: i })), straws, turnIndex: 0, gameOver: false, gameType };
      activeGames.set(gameId, gameData);
      eventName = "short_straw_started";
      eventData = { ...eventData, players: gameData.players, straws: gameData.straws, turnSocketId: gameData.players[0].socketId };
    } else if (gameType === 'spin_bottle') {
      const gameData = { players: players.map((p, i) => ({ ...p, order: i })), rotation: 0, turnIndex: 0, gameOver: false, gameType };
      activeGames.set(gameId, gameData);
      eventName = "spin_bottle_started";
      eventData = { ...eventData, players: gameData.players, turnSocketId: gameData.players[0].socketId };
    } else if (gameType === 'bride_bouquet') {
      const gameData = { players: players.map((p, i) => ({ ...p, order: i })), gameOver: false, gameType };
      activeGames.set(gameId, gameData);
      eventName = "bride_bouquet_started";
      eventData = { ...eventData, players: gameData.players };
    } else if (gameType === 'wheel_of_fortune') {
      const gameData = { players: players.map((p, i) => ({ ...p, order: i })), results: [], turnIndex: 0, gameOver: false, gameType };
      activeGames.set(gameId, gameData);
      eventName = "wheel_of_fortune_started";
      eventData = { ...eventData, players: gameData.players, turnSocketId: gameData.players[0].socketId };
    } else if (gameType === 'coin_flip') {
      const turnSocketId = players[0].socketId;
      const gameData = { players: players.map((p, i) => ({ ...p, order: i })), choices: [], gameOver: false, gameType, turnSocketId, round: 1, totalRounds: 3 };
      activeGames.set(gameId, gameData);
      eventName = "coin_flip_started";
      eventData = { ...eventData, players: gameData.players, turnSocketId };
      
      // If the first player is a bot, simulate their choice
      if (turnSocketId.startsWith('bot_')) {
        setTimeout(() => {
          processCoinFlipChoice(gameId, turnSocketId, Math.random() > 0.5 ? 'heads' : 'tails');
        }, 1500);
      }
    }

    sendBotEvent(socket.id, eventName, eventData, 1000, gameId);
  };

  socket.on("find_random_match", () => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    if (waitingQueue.includes(socket.id)) return;

    if (waitingQueue.length > 0) {
      const opponentSocketId = waitingQueue.shift()!;
      const opponent = onlineUsers.get(opponentSocketId);
      if (opponent) {
        const gameId = `game_${socket.id}_${opponentSocketId}`;
        const gameData = { players: [{ ...user, choice: null, score: 0, socketId: socket.id }, { ...opponent, choice: null, score: 0, socketId: opponentSocketId }], round: 1, totalRounds: 3 };
        activeGames.set(gameId, gameData);
        socket.join(gameId);
        io.to(opponentSocketId).socketsJoin(gameId);
        
        socket.emit("match_found", { gameId, opponent: opponent.name, players: gameData.players, isHost: false, isRandom: true });
        io.to(opponentSocketId).emit("match_found", { gameId, opponent: user.name, players: gameData.players, isHost: true, isRandom: true });
      }
    } else {
      waitingQueue.push(socket.id);
      socket.emit("waiting_for_match");
      
      setTimeout(() => {
        const queueIndex = waitingQueue.indexOf(socket.id);
        if (queueIndex !== -1) {
          waitingQueue.splice(queueIndex, 1);
          
          const randomBotName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
          const botSocketId = `bot_${randomBotName}`;
          let opponent = onlineUsers.get(botSocketId);
          if (!opponent) {
            opponent = { id: botSocketId, name: randomBotName, socketId: botSocketId };
          }

          const gameId = `game_${socket.id}_${botSocketId}`;
          const gameData = { players: [{ ...user, choice: null, score: 0, socketId: socket.id }, { ...opponent, choice: null, score: 0, socketId: botSocketId }], round: 1, totalRounds: 3 };
          activeGames.set(gameId, gameData);
          socket.join(gameId);
          
          sendBotEvent(socket.id, "match_found", { gameId, opponent: opponent.name, players: gameData.players, isHost: true, isRandom: true }, 1000, gameId);
        }
      }, 5000);
    }
  });

  socket.on("wheel_of_fortune_spin", ({ gameId, rotation, resultValue }: { gameId: string; rotation: number; resultValue: number }) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    const playerIndex = game.players.findIndex((p: any) => p.socketId === socket.id);
    if (playerIndex === -1) return;
    game.results[playerIndex] = resultValue;
    io.to(gameId).emit("wheel_of_fortune_spin_result", { socketId: socket.id, rotation, resultValue });
    if (game.players.some((p: any) => p.socketId.startsWith('bot_'))) {
      const botIndex = game.players.findIndex((p: any) => p.socketId.startsWith('bot_'));
      if (game.results[botIndex] === undefined) {
        setTimeout(() => {
          const botResult = Math.floor(Math.random() * 1000);
          const sectionIndex = Math.floor(Math.random() * 9);
          const targetAngle = 90 - (sectionIndex * 40);
          const botRotation = rotation + 1800 + (targetAngle - (rotation % 360));
          game.results[botIndex] = botResult;
          io.to(gameId).emit("wheel_of_fortune_spin_result", { socketId: game.players[botIndex].socketId, rotation: botRotation, resultValue: botResult });
          checkWheelWinner(gameId);
        }, 3500);
      } else checkWheelWinner(gameId);
    } else if (game.results.filter((r: any) => r !== undefined).length === 2) checkWheelWinner(gameId);
  });

  const checkWheelWinner = (gameId: string) => {
    const game = activeGames.get(gameId);
    if (!game || !game.results || game.results.length < 2) return;
    const r1 = game.results[0];
    const r2 = game.results[1];
    if (r1 === r2) { 
      game.results = []; 
      io.to(gameId).emit("wheel_of_fortune_draw", { message: "Draw! Spin again!" }); 
    } else { 
      const winnerIndex = r1 > r2 ? 0 : 1; 
      const winner = game.players[winnerIndex]; 
      io.to(gameId).emit("wheel_of_fortune_result", { winnerName: winner.name, winnerSocketId: winner.socketId }); 
      game.results = []; 
    }
  };

  const handleSpinBottleResult = (gameId: string, winner: any, depth: number = 0) => {
    if (depth > 5) return; // Prevent infinite bot loops
    if (winner.socketId.startsWith('bot_')) {
      setTimeout(() => {
        const game = activeGames.get(gameId);
        if (!game) return;
        const nextWinnerIndex = Math.floor(Math.random() * game.players.length);
        const nextRotation = (game.rotation || 0) + 1800 + Math.random() * 360;
        game.rotation = nextRotation;
        const nextWinner = game.players[nextWinnerIndex];
        game.turnSocketId = nextWinner.socketId;
        io.to(gameId).emit("spin_bottle_result", { rotation: nextRotation, winnerName: nextWinner.name, winnerSocketId: nextWinner.socketId });
        
        handleSpinBottleResult(gameId, nextWinner, depth + 1);
      }, 3000);
    }
  };

  socket.on("spin_bottle_spin", ({ gameId, rotation, winnerIndex }: { gameId: string; rotation: number; winnerIndex: number }) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    const winner = game.players[winnerIndex];
    game.turnSocketId = winner.socketId;
    game.rotation = rotation;
    io.to(gameId).emit("spin_bottle_result", { rotation, winnerName: winner.name, winnerSocketId: winner.socketId });
    
    handleSpinBottleResult(gameId, winner);
  });

  socket.on("bride_bouquet_toss", ({ gameId }: { gameId: string }) => {
    const game = activeGames.get(gameId);
    if (!game || game.gameOver) return;
    const catcherIndex = Math.floor(Math.random() * game.players.length);
    const catcher = game.players[catcherIndex];
    game.gameOver = true;
    io.to(gameId).emit("bride_bouquet_result", { catcherName: catcher.name, catcherSocketId: catcher.socketId });
  });

  const processCoinFlipChoice = (gameId: string, socketId: string, choice: string) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    const playerIndex = game.players.findIndex((p: any) => p.socketId === socketId);
    if (playerIndex === -1) return;
    
    // Only the turn owner can choose (if a turn owner is defined)
    if (game.turnSocketId !== undefined && game.turnSocketId !== socketId) return;
    
    const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
    game.choices[playerIndex] = choice;
    game.choices[otherPlayerIndex] = choice === 'heads' ? 'tails' : 'heads';
    
    const result = Math.random() > 0.5 ? 'heads' : 'tails';
    const winnerIndex = game.choices.findIndex((c: any) => c === result);
    const winnerSocketId = game.players[winnerIndex].socketId;
    const winnerName = game.players[winnerIndex].name;
    
    // Next turn goes to the winner
    game.turnSocketId = winnerSocketId;
    
    io.to(gameId).emit("coin_flip_result", { result, winnerName, winnerSocketId, nextTurnSocketId: winnerSocketId });
    
    // Increment round
    if (game.round !== undefined && game.totalRounds !== undefined) {
      if (game.round >= game.totalRounds) {
        game.gameOver = true;
      } else {
        game.round++;
      }
    }
    
    const nextPlayer = game.players.find((p: any) => p.socketId === winnerSocketId);
    if (!game.gameOver && nextPlayer && nextPlayer.socketId.startsWith('bot_')) {
      setTimeout(() => {
        const currentBotChoice = Math.random() > 0.5 ? 'heads' : 'tails';
        processCoinFlipChoice(gameId, nextPlayer.socketId, currentBotChoice);
      }, 4500);
    }
  };

  socket.on("coin_flip_choice", ({ gameId, choice }: { gameId: string; choice: string }) => {
    processCoinFlipChoice(gameId, socket.id, choice);
  });

  socket.on("pull_straw_straw", ({ gameId, index }: { gameId: string; index: number }) => {
    const game = activeGames.get(gameId);
    if (!game || game.gameOver) return;
    const currentPlayer = game.players[game.turnIndex];
    if (currentPlayer.socketId !== socket.id) return;
    const straw = game.straws[index];
    if (straw.isPulled) return;
    straw.isPulled = true;
    if (straw.isShort) {
      game.gameOver = true;
      io.to(gameId).emit("short_straw_result", { index, isShort: true, loserSocketId: socket.id, loserName: currentPlayer.name });
    } else {
      game.turnIndex = (game.turnIndex + 1) % game.players.length;
      const nextPlayer = game.players[game.turnIndex];
      io.to(gameId).emit("short_straw_update", { index, isShort: false, nextTurnSocketId: nextPlayer.socketId, nextTurnName: nextPlayer.name });
      if (nextPlayer.socketId.startsWith('bot_')) {
        setTimeout(() => {
          const availableStraws = game.straws.filter((s: any) => !s.isPulled);
          if (availableStraws.length > 0) {
            const randomStrawIndex = game.straws.indexOf(availableStraws[Math.floor(Math.random() * availableStraws.length)]);
            const randomStraw = game.straws[randomStrawIndex];
            randomStraw.isPulled = true;
            if (randomStraw.isShort) {
              game.gameOver = true;
              io.to(gameId).emit("short_straw_result", { index: randomStrawIndex, isShort: true, loserSocketId: nextPlayer.socketId, loserName: nextPlayer.name });
            } else {
              game.turnIndex = (game.turnIndex + 1) % game.players.length;
              const nPlayer = game.players[game.turnIndex];
              io.to(gameId).emit("short_straw_update", { index: randomStrawIndex, isShort: false, nextTurnSocketId: nPlayer.socketId, nextTurnName: nPlayer.name });
            }
          }
        }, 1000);
      }
    }
  });

  // Invites
  socket.on("invite_short_straw", ({ targetName, gameId }) => {
    const user = onlineUsers.get(socket.id); if (!user) return;
    const targetUser = Array.from(onlineUsers.values()).find(u => u.name.toLowerCase() === targetName.toLowerCase());
    if (targetUser && targetUser.socketId.startsWith('bot_')) handleBotInvite('short_straw', gameId, targetUser, user);
    else if (targetUser) { io.to(targetUser.socketId).emit("receive_short_straw_invite", { from: user.name, fromSocketId: socket.id, gameId }); socket.emit("invite_sent", { to: targetUser.name, targetSocketId: targetUser.socketId }); }
    else socket.emit("user_not_found");
  });
  socket.on("invite_spin_bottle", ({ targetName, gameId }) => {
    const user = onlineUsers.get(socket.id); if (!user) return;
    const targetUser = Array.from(onlineUsers.values()).find(u => u.name.toLowerCase() === targetName.toLowerCase());
    if (targetUser && targetUser.socketId.startsWith('bot_')) handleBotInvite('spin_bottle', gameId, targetUser, user);
    else if (targetUser) { io.to(targetUser.socketId).emit("receive_spin_bottle_invite", { from: user.name, fromSocketId: socket.id, gameId }); socket.emit("invite_sent", { to: targetUser.name, targetSocketId: targetUser.socketId }); }
    else socket.emit("user_not_found");
  });
  socket.on("invite_bride_bouquet", ({ targetName, gameId }) => {
    const user = onlineUsers.get(socket.id); if (!user) return;
    const targetUser = Array.from(onlineUsers.values()).find(u => u.name.toLowerCase() === targetName.toLowerCase());
    if (targetUser && targetUser.socketId.startsWith('bot_')) handleBotInvite('bride_bouquet', gameId, targetUser, user);
    else if (targetUser) { io.to(targetUser.socketId).emit("receive_bride_bouquet_invite", { from: user.name, fromSocketId: socket.id, gameId }); socket.emit("invite_sent", { to: targetUser.name, targetSocketId: targetUser.socketId }); }
    else socket.emit("user_not_found");
  });
  socket.on("invite_wheel_of_fortune", ({ targetName, gameId }) => {
    const user = onlineUsers.get(socket.id); if (!user) return;
    const targetUser = Array.from(onlineUsers.values()).find(u => u.name.toLowerCase() === targetName.toLowerCase());
    if (targetUser && targetUser.socketId.startsWith('bot_')) handleBotInvite('wheel_of_fortune', gameId, targetUser, user);
    else if (targetUser) { io.to(targetUser.socketId).emit("receive_wheel_of_fortune_invite", { from: user.name, fromSocketId: socket.id, gameId }); socket.emit("invite_sent", { to: targetUser.name, targetSocketId: targetUser.socketId }); }
    else socket.emit("user_not_found");
  });
  socket.on("invite_coin_flip", ({ targetName, gameId }) => {
    const user = onlineUsers.get(socket.id); if (!user) return;
    const targetUser = Array.from(onlineUsers.values()).find(u => u.name.toLowerCase() === targetName.toLowerCase());
    if (targetUser && targetUser.socketId.startsWith('bot_')) handleBotInvite('coin_flip', gameId, targetUser, user);
    else if (targetUser) { io.to(targetUser.socketId).emit("receive_coin_flip_invite", { from: user.name, fromSocketId: socket.id, gameId }); socket.emit("invite_sent", { to: targetUser.name, targetSocketId: targetUser.socketId }); }
    else socket.emit("user_not_found");
  });

  socket.on("make_choice", ({ gameId, choice }) => {
    const game = activeGames.get(gameId); if (!game) return;
    const player = game.players.find(p => p.socketId === socket.id); if (player) player.choice = choice;
    game.players.forEach(p => { if (p.socketId.startsWith('bot_') && !p.choice) { const choices = ["rock", "paper", "scissors"]; p.choice = choices[Math.floor(Math.random() * choices.length)]; } });
    if (game.players.every(p => p.choice !== null)) {
      const [p1, p2] = game.players; let winner = "draw";
      if (p1.choice !== p2.choice) {
        if ((p1.choice === "rock" && p2.choice === "scissors") || (p1.choice === "paper" && p2.choice === "rock") || (p1.choice === "scissors" && p2.choice === "paper")) { winner = p1.socketId; p1.score++; }
        else { winner = p2.socketId; p2.score++; }
      }
      io.to(gameId).emit("round_result", { choices: game.players.map(p => ({ socketId: p.socketId, choice: p.choice })), winner, scores: game.players.map(p => ({ socketId: p.socketId, score: p.score })) });
      game.players.forEach(p => p.choice = null); game.round++;
    }
  });

  socket.on("disconnect", () => { 
    onlineUsers.delete(socket.id); 
    const queueIndex = waitingQueue.indexOf(socket.id); 
    if (queueIndex !== -1) waitingQueue.splice(queueIndex, 1); 
    io.emit("online_users_count", onlineUsers.size); 
    
    // Memory Leak Fix: Clean up active games on disconnect
    for (const [gameId, game] of activeGames.entries()) {
      if (game.players && game.players.some((p: any) => p.socketId === socket.id)) {
        activeGames.delete(gameId);
      }
    }
  });
});

// ... (existing code)

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ 
      server: { middlewareMode: true, hmr: { port: 24679 } }, 
      appType: "spa" 
    });
    
    app.use(vite.middlewares);
    
    app.get("*", async (req, res, next) => {
      console.log(`[SERVER] Request: ${req.originalUrl}`);
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(".", "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        console.error("[SERVER] Error:", e);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => res.sendFile("dist/index.html", { root: "." }));
  }
  
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Ready at http://localhost:${PORT}`);
  });
}
startServer();
