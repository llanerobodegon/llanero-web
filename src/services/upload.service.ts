"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export const uploadService = {
  async uploadImage(
    file: File,
    bucket: string,
    folder?: string
  ): Promise<string> {
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return data.publicUrl;
  },

  async deleteImage(url: string, bucket: string): Promise<void> {
    // Extract file path from URL
    const urlParts = url.split(`${bucket}/`);
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Specific helpers for warehouse logos
  async uploadWarehouseLogo(file: File): Promise<string> {
    return this.uploadImage(file, "warehouse-logos");
  },

  async deleteWarehouseLogo(url: string): Promise<void> {
    return this.deleteImage(url, "warehouse-logos");
  },
};
