export type PdfFile = {
  path: string;
  folder: string;
};

export type Metadata = {
  composer: string;
  tags: string[];
  notes: string;
};

export type MetadataMap = Record<string, Metadata>;

export type Share = {
  token: string;
  path: string;
  label: string;
  created_at: string;
  url: string;
  isFolder?: boolean;
};
