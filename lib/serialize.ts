import type { Document } from "mongoose";

export type WithId<T> = T & { id: string };

export function serialize<T extends Document>(doc: T | null): WithId<T> | null {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...rest } = obj as any;
  return { id: _id.toString(), ...rest } as WithId<T>;
}

export function serializeAll<T extends Document>(docs: T[]): WithId<T>[] {
  return docs.map((d) => serialize(d)!).filter(Boolean);
}
