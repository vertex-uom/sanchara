import { BLOCK_TYPES, type BlockType } from "./builder-blocks";

// Drags carry what they are in the dataTransfer *type* (data can only be
// read on drop), so the canvas can say "Drop Gallery here" while dragging.
const NEW_BLOCK_PREFIX = "application/x-sanchara-block-";
const MOVE_BLOCK_PREFIX = "application/x-sanchara-move-";

export const newBlockMime = (type: BlockType) => `${NEW_BLOCK_PREFIX}${type}`;
export const moveBlockMime = (id: string) => `${MOVE_BLOCK_PREFIX}${id}`;

export type DragItem =
  { kind: "new"; type: BlockType } | { kind: "move"; id: string };

export function readDrag(types: readonly string[]): DragItem | null {
  for (const type of types) {
    if (type.startsWith(NEW_BLOCK_PREFIX)) {
      const block = type.slice(NEW_BLOCK_PREFIX.length) as BlockType;
      if (BLOCK_TYPES.includes(block)) return { kind: "new", type: block };
    }
    if (type.startsWith(MOVE_BLOCK_PREFIX))
      return { kind: "move", id: type.slice(MOVE_BLOCK_PREFIX.length) };
  }
  return null;
}
