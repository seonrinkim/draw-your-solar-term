import { supabase } from "@/lib/supabase";

export interface StrokePath {
  d: string;
  width: number;
}

export interface DrawingRecord {
  id: string;
  term_slug: string;
  color: string;
  svg_paths: StrokePath[];
  canvas_width: number;
  canvas_height: number;
  nickname: string;
  note: string;
  consent: boolean;
  created_at: string;
}

export type NewDrawing = Omit<DrawingRecord, "id" | "created_at">;

export async function fetchDrawings(limit = 200): Promise<DrawingRecord[]> {
  const { data, error } = await supabase
    .from("drawings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch drawings", error);
    return [];
  }
  return data as DrawingRecord[];
}

export async function submitDrawing(
  drawing: NewDrawing
): Promise<DrawingRecord | null> {
  const { data, error } = await supabase
    .from("drawings")
    .insert(drawing)
    .select()
    .single();

  if (error) {
    console.error("Failed to submit drawing", error);
    throw error;
  }
  return data as DrawingRecord;
}

export function subscribeToNewDrawings(
  onInsert: (drawing: DrawingRecord) => void
) {
  const channel = supabase
    .channel("drawings-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "drawings" },
      (payload) => {
        onInsert(payload.new as DrawingRecord);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
