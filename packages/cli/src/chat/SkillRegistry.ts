import { listDirSkill } from "./skills/ListDirSkill";
import { readFileSkill } from "./skills/ReadFileSkill";
import { runCommandSkill } from "./skills/RunCommandSkill";
import { searchReplaceSkill } from "./skills/SearchReplaceSkill";
import { Skill } from "./skills/types";
import { writeFileSkill } from "./skills/WriteFileSkill";

/** All registered chat skills, keyed by name. */
export const SKILL_REGISTRY: ReadonlyMap<string, Skill> = new Map(
    [readFileSkill, writeFileSkill, searchReplaceSkill, listDirSkill, runCommandSkill].map(s => [s.name, s])
);

/**
 * Returns every registered skill.
 * @returns The skill list.
 */
export function getSkills(): Skill[] {
    return [...SKILL_REGISTRY.values()];
}
