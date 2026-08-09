import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import fs from "fs-extra";
import type { Agent, GraphNode, ProjectGroup } from "../src/types";

/**
 * 初回起動時の自動セットアップ。
 *
 * デスクトップアプリ最大の離脱点は「入れた直後に何も無い画面が出て、CLIを入れて認証して
 * 陣地を作って…」という初期設定の壁。ここで大半が死ぬ (Cursor が VS Code の設定を
 * ワンクリックで引き継いで乗り換えコストを消したのと同じ問題)。
 *
 * そこで、ワークスペースが空のときだけ **インストール済みの CLI と最近さわった
 * プロジェクトフォルダを自動検出して、初期状態の盤面を作っておく**。
 * ユーザーは起動した瞬間に「自分のフォルダが並んだ盤面」を見て、Start を押すだけでよい。
 *
 * 注意 (このマシン固有の罠): Desktop/Documents は iCloud 同期下にあり、evict された
 * ファイルを **読む** と永久にブロックする。ここでは readdir と stat しか使わず、
 * ファイルの中身は一切読まない (stat は dataless でも即座に返る)。
 */

const CLI_CANDIDATES: Agent["type"][] = ["claude", "codex", "gemini", "grok"];

const AGENT_TYPE_COMMAND: Record<string, string> = {
  claude: "claude",
  codex: "codex",
  gemini: "gemini",
  grok: "grok"
};

const AGENT_TYPE_LABEL: Record<string, string> = {
  claude: "Claude",
  codex: "Codex",
  gemini: "Gemini",
  grok: "Grok"
};

/** プロジェクトらしさの目印。中身は読まず存在確認だけ行う。 */
const PROJECT_MARKERS = [".git", "package.json", "pyproject.toml", "Cargo.toml", "go.mod", "Gemfile"];

/** 走査する親ディレクトリ。実在するものだけ使う。 */
const SCAN_ROOTS = ["dev", "src", "Projects", "projects", "repos", "work", "Documents", "Desktop"];

const SKIP_DIRS = new Set(["node_modules", "Library", "Applications", "Pictures", "Movies", "Music", ".Trash"]);

const MAX_TERRITORIES = 4;

export function detectInstalledClis(): Agent["type"][] {
  return CLI_CANDIDATES.filter((type) => {
    try {
      // ensureGuiPath() 済みの PATH で探す (Finder 起動でも Homebrew が見える)
      execFileSync("which", [AGENT_TYPE_COMMAND[type]], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  });
}

/** プロジェクトらしいフォルダを、最近さわった順に返す。 */
export function detectProjectFolders(limit = MAX_TERRITORIES): string[] {
  const home = homedir();
  const found: { path: string; mtimeMs: number }[] = [];

  for (const root of SCAN_ROOTS) {
    const rootPath = join(home, root);
    let entries: string[];
    try {
      if (!fs.statSync(rootPath).isDirectory()) {
        continue;
      }
      entries = fs.readdirSync(rootPath);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.startsWith(".") || SKIP_DIRS.has(entry)) {
        continue;
      }
      const candidate = join(rootPath, entry);
      try {
        const stat = fs.statSync(candidate);
        if (!stat.isDirectory()) {
          continue;
        }
        const isProject = PROJECT_MARKERS.some((marker) => fs.existsSync(join(candidate, marker)));
        if (isProject) {
          found.push({ path: candidate, mtimeMs: stat.mtimeMs });
        }
      } catch {
        // 権限が無い / 消えた等は黙って飛ばす
      }
    }
  }

  // macOS のファイルシステムは大文字小文字を区別しないため、~/Projects と ~/projects が
  // 同じ実体を指す。realpath + 小文字化で重複を落とす (実測で重複を確認済み)。
  const seen = new Set<string>();
  const unique: { path: string; mtimeMs: number }[] = [];
  for (const item of found.sort((a, b) => b.mtimeMs - a.mtimeMs)) {
    let key: string;
    try {
      key = fs.realpathSync(item.path).toLowerCase();
    } catch {
      key = item.path.toLowerCase();
    }
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  return unique.slice(0, limit).map((item) => item.path);
}

export type FirstRunSeed = {
  groups: ProjectGroup[];
  agents: Agent[];
  nodes: GraphNode[];
};

/**
 * 検出結果から初期盤面を組み立てる。
 *
 * - 陣地 = 検出したプロジェクトフォルダ (最大4)
 * - 各陣地に **1体だけ** エージェントを置く。種類は検出できた CLI を順番に割り当てるので、
 *   2種類以上入っていれば最初から「別ベンダーが並んだ盤面」になる
 * - **起動はしない** (status: "stopped")。勝手に CLI を走らせて課金が発生するのは論外なので、
 *   Start は必ずユーザーに押させる
 * - 座標は 0 のまま置く。実際の配置は renderer 側の arrangeAll (tidy tree) が決める
 */
export function buildFirstRunSeed(clis: Agent["type"][], folders: string[]): FirstRunSeed {
  if (clis.length === 0 || folders.length === 0) {
    return { groups: [], agents: [], nodes: [] };
  }

  const now = new Date().toISOString();
  const groups: ProjectGroup[] = [];
  const agents: Agent[] = [];
  const nodes: GraphNode[] = [];
  const usedNames = new Set<string>();

  // 検出できた CLI を全種類ばらまくと、インストールだけして認証していない CLI まで
  // 配置してしまう。「複数ベンダーを扱える」ことは伝えつつ実害を避けるため、
  // 優先順位の上位2種類だけを交互に割り当てる。
  const assignable = clis.slice(0, 2);

  folders.forEach((folderPath, index) => {
    const groupId = `group_seed_${index}`;
    groups.push({
      id: groupId,
      name: basename(folderPath),
      folderPath,
      parentGroupId: null,
      position: { x: 0, y: 0 },
      size: { width: 240, height: 96 },
      createdAt: now
    });

    const type = assignable[index % assignable.length];
    const base = AGENT_TYPE_LABEL[type];
    let name = base;
    let counter = 1;
    while (usedNames.has(name)) {
      counter += 1;
      name = `${base} ${counter}`;
    }
    usedNames.add(name);

    const agentId = `agent_seed_${index}`;
    agents.push({
      id: agentId,
      name,
      type,
      mode: "interactive",
      permissionPolicy: "safe-auto",
      command: AGENT_TYPE_COMMAND[type],
      workingDirectory: folderPath,
      role: "",
      systemPrompt: "",
      status: "stopped"
    });

    nodes.push({
      id: `node_seed_${index}`,
      agentId,
      position: { x: 0, y: 0 },
      isRoot: false,
      groupId
    });
  });

  return { groups, agents, nodes };
}

/** ワークスペースが空のときだけ初期盤面を作る。既存ユーザーには一切触らない。 */
export function buildSeedIfEmpty(existingAgents: number, existingGroups: number): FirstRunSeed | null {
  if (existingAgents > 0 || existingGroups > 0) {
    return null;
  }

  const clis = detectInstalledClis();
  const folders = detectProjectFolders();
  const seed = buildFirstRunSeed(clis, folders);
  if (seed.groups.length === 0) {
    return null;
  }

  console.log(
    `[MAO first-run] detected CLIs: ${clis.join(", ") || "(none)"} / folders: ${seed.groups
      .map((group) => group.name)
      .join(", ")}`
  );
  return seed;
}
