"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Video } from "@/types/database";
import Image from "next/image";
import { SortableHeader } from "./ui/data-table";
import { formatDuration } from "@/lib/utils/duration";

export const videoColumns: ColumnDef<Video>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        aria-label="Select all"
        className="h-4 w-4 rounded border-gray-300"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(!!e.target.checked)}
        aria-label="Select row"
        className="h-4 w-4 rounded border-gray-300"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "thumbnail_url",
    header: "Thumbnail",
    cell: ({ row }) => {
      const video = row.original;
      return (
        <div className="relative h-16 w-24 overflow-hidden rounded-md bg-gray-200">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title || "Video thumbnail"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {/* Duration Badge */}
          <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration_seconds)}
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <SortableHeader column={column}>Title</SortableHeader>
    ),
    cell: ({ row }) => {
      const video = row.original;
      return (
        <div className="max-w-md">
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {video.title}
          </h3>
          {video.made_for_kids && (
            <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
              Kids
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "watch_count",
    header: ({ column }) => (
      <SortableHeader column={column}>Watched</SortableHeader>
    ),
    cell: ({ row }) => {
      const count = row.getValue("watch_count") as number;
      return (
        <div className="text-sm text-gray-700">
          {count}× {count === 0 && <span className="text-gray-400">(Never)</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "duration_seconds",
    header: ({ column }) => (
      <SortableHeader column={column}>Duration</SortableHeader>
    ),
    cell: ({ row }) => {
      const seconds = row.getValue("duration_seconds") as number;
      return (
        <div className="text-sm text-gray-700">
          {formatDuration(seconds)}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <SortableHeader column={column}>Added</SortableHeader>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-sm text-gray-700">
          {date.toLocaleDateString()}
        </div>
      );
    },
  },
];
