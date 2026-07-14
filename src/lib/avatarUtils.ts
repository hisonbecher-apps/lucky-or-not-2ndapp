// Avatar assets mapping
import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';
import avatar6 from '../assets/avatars/avatar6.png';
import avatar7 from '../assets/avatars/avatar7.png';
import avatar8 from '../assets/avatars/avatar8.png';
import avatar9 from '../assets/avatars/avatar9.png';
import avatar10 from '../assets/avatars/avatar10.png';
import avatar11 from '../assets/avatars/avatar11.png';
import avatar12 from '../assets/avatars/avatar12.png';
import avatar13 from '../assets/avatars/avatar13.png';
import avatar14 from '../assets/avatars/avatar14.png';

export const AVATARS = [
  avatar1, avatar2, avatar3, avatar4, avatar5,
  avatar6, avatar7, avatar8, avatar9, avatar10,
  avatar11, avatar12, avatar13, avatar14
];

export const getAvatarUrl = (index: number) => {
  if (index >= 0 && index < AVATARS.length) {
    return AVATARS[index];
  }
  return avatar1; // Fallback
};
