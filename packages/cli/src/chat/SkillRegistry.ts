import { findAndReplaceSkill } from "./skills/find-and-replace";
import { listDirSkill } from "./skills/list-dir";
import { readFileSkill } from "./skills/read-file";
import { runCommandSkill } from "./skills/run-command";
import { Skill } from "./Types";
import { writeFileSkill } from "./skills/write-file";

/** All registered chat skills, keyed by name. */
export const SKILL_REGISTRY: ReadonlyMap<string, Skill> = new Map(
    [readFileSkill, findAndReplaceSkill, writeFileSkill, listDirSkill, runCommandSkill].map(s => [s.name, s])
);

/**
 * Returns every registered skill.
 * @returns The skill list.
 */
export function getSkills(): Skill[] {
    return [...SKILL_REGISTRY.values()];
}
