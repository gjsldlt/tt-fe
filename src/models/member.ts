export type Member = {
  id: string;
  auth_user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: "unverified" | "member" | "admin";
  active: boolean;
};
