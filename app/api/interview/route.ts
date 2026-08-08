import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "The interview engine is not implemented yet. This endpoint is reserved for a later prompt.",
    },
    { status: 501 },
  );
}
