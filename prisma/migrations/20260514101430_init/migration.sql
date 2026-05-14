-- CreateTable
CREATE TABLE "Metadata" (
    "path" TEXT NOT NULL PRIMARY KEY,
    "composer" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Share" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "created_at" TEXT NOT NULL DEFAULT (datetime('now'))
);
