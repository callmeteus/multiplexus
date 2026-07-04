import { listDirSkill } from "./ListDirSkill";
import { readFileSkill } from "./ReadFileSkill";
import { searchReplaceSkill } from "./SearchReplaceSkill";
import { Skill } from "./types";
import { writeFileSkill } from "./WriteFileSkill";

/** All registered chat skills, keyed by name. */
export const SKILL_REGISTRY: ReadonlyMap<string, Skill> = new Map(
    [readFileSkill, writeFileSkill, searchReplaceSkill, listDirSkill].map(s => [s.name, s])
);

/**
 * Returns every registered skill.
 * @returns The skill list.
 */
export function getSkills(): Skill[] {
    return [...SKILL_REGISTRY.values()];
}
