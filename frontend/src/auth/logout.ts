// There is no explicit backend logout endpoint in the task statement.
// We keep the helper so the UI can call it consistently.
export async function logout(): Promise<void> {
    // Intentionally no-op.
}

