import type { Localized } from "./monsters";

const STORAGE_KEY = "oam.roleChoices.v1";

export type RoleChoice = {
  id: string;
  label: Localized;
};

export const DEFAULT_ROLE_CHOICES: RoleChoice[] = [
  {
    id: "lead",
    label: { ko: "팀장", en: "Team lead" },
  },
  {
    id: "dev",
    label: { ko: "개발자", en: "Developer" },
  },
  {
    id: "designer",
    label: { ko: "디자이너", en: "Designer" },
  },
];

function uid(): string {
  return `role_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function loadRoleChoices(): RoleChoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw) as RoleChoice[];
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneDefaults();
    return parsed
      .filter((r) => r && r.id && r.label?.ko && r.label?.en)
      .map((r) => ({
        id: String(r.id),
        label: { ko: String(r.label.ko), en: String(r.label.en) },
      }));
  } catch {
    return cloneDefaults();
  }
}

export function saveRoleChoices(choices: RoleChoice[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(choices));
}

export function cloneDefaults(): RoleChoice[] {
  return DEFAULT_ROLE_CHOICES.map((r) => ({
    id: r.id,
    label: { ...r.label },
  }));
}

export function addRoleChoice(
  choices: RoleChoice[],
  ko: string,
  en: string,
): RoleChoice[] {
  const next = [
    ...choices,
    { id: uid(), label: { ko: ko.trim() || "역할", en: en.trim() || "Role" } },
  ];
  saveRoleChoices(next);
  return next;
}

export function removeRoleChoice(
  choices: RoleChoice[],
  id: string,
): RoleChoice[] {
  if (choices.length <= 1) return choices;
  const next = choices.filter((c) => c.id !== id);
  saveRoleChoices(next);
  return next;
}

export function resetRoleChoices(): RoleChoice[] {
  const next = cloneDefaults();
  saveRoleChoices(next);
  return next;
}
