import { NextResponse } from "next/server";

export function successResponse(message: string, data: unknown, status = 200) {
    return NextResponse.json(
        {
            result: 1,
            type: "success",
            message,
            data,
        },
        { status },
    );
}

export function errorResponse(
    message: string,
    error: unknown = [],
    status = 400,
) {
    return NextResponse.json(
        {
            result: 0,
            type: "error",
            message,
            error,
        },
        { status },
    );
}
