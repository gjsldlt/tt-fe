export type Program = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  created_by: string; // memberId
  created_at?: string; // ISO date string
};
