"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/app/context/user-context";

type Member = {
  id: string;
  auth_user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: "admin" | "member" | "unverified";
  active: boolean;
};

type MemberContextType = {
  member: Member | null;
  members: Member[];
  refreshMembers: () => Promise<void>;
  loading: boolean;
  refreshMember: () => Promise<void>;
};

const MemberContext = createContext<MemberContextType>({
  member: null,
  members: [],
  loading: true,
  refreshMember: async () => {},
  refreshMembers: async () => {},
});

export const useMember = () => useContext(MemberContext);

export function MemberProvider({ children }: { children: ReactNode }) {
  const userContext = useUser();
  const user = userContext;
  const userLoading = userContext === null;
  const supabase = createClient();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);

  const fetchMember = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("member")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (error) {
      console.warn("Error fetching member:", error.message);
      setMember(null);
    } else {
      setMember(data);
    }

    setLoading(false);
  }, [user, supabase]);

  // Fetch all members
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("member").select("*");
    if (error) {
      console.warn("Error fetching members:", error.message);
      setMembers([]);
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (userLoading) return;
    if (user) fetchMember();
    else {
      setMember(null);
      setLoading(false);
    }
  }, [user, userLoading, fetchMember]);

  return (
    <MemberContext.Provider
      value={{
        member,
        loading,
        members,
        refreshMember: fetchMember,
        refreshMembers: fetchMembers,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}
