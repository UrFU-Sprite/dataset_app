import type {WalletResponse} from './finance'
import type {DashboardResponse} from './analytics'
import type {Task, TaskImage, Project, User} from './types'
import type {CreateTaskPayload, SubmitTaskPayload} from './tasks'

function safeGlobal(): any {
    try {
        return window as any
    } catch {
        return {}
    }
}

export function isMockEnabled(): boolean {
    const g = safeGlobal()
    const flag = g.__DATASET_APP_USE_MOCKS__
    if (typeof flag === 'boolean') return flag
    try {
        return localStorage.getItem('dataset_app_use_mocks') === 'true'
    } catch {
        return false
    }
}

function delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

let mockProjects: Project[] = [
    {id: 1, name: 'Cats vs Dogs', description: 'Binary classification dataset'},
    {id: 2, name: 'Vehicles', description: 'Object captions and labeling'},
]

let mockTaskSeq = 100

let mockTasks: Task[] = [
    {
        id: 1,
        projectId: 1,
        status: 'open',
        images: [
            {
                url: 'https://picsum.photos/seed/cat-1/512/512',
                caption: '',
            },
            {
                url: 'https://picsum.photos/seed/dog-1/512/512',
                caption: '',
            },
        ],
    },
    {
        id: 2,
        projectId: 2,
        status: 'in_progress',
        images: [
            {
                url: 'https://picsum.photos/seed/vehicle-1/512/512',
                caption: 'A vehicle on the road',
            },
        ],
    },
]

function getTaskImages(task: Task): TaskImage[] {
    if (Array.isArray(task.images)) return task.images
    if (task.data?.images) return task.data.images
    return []
}

function getTasksStats() {
    const total = mockTasks.length
    const completed = mockTasks.filter((t) => t.status === 'completed' || t.status === 'done').length
    const open = total - completed
    return {total, completed, open}
}

// -----------------------
// Auth mocks
// -----------------------

const TOKEN_PREFIX = 'mock-token:'

export async function mockLoginUser(payload: {email: string; password: string}): Promise<string> {
    // Password is ignored for the mock.
    await delay(250)
    const token = `${TOKEN_PREFIX}${payload.email}`
    try {
        localStorage.setItem('dataset_app_mock_email', payload.email)
        localStorage.setItem('dataset_app_token', token)
    } catch {
        // ignore
    }
    return token
}

export async function mockRegisterUser(_payload: {email: string; password: string}): Promise<void> {
    await delay(250)
}

export async function mockGetMe(): Promise<User> {
    await delay(200)
    let email = 'mock@example.com'
    try {
        email = localStorage.getItem('dataset_app_mock_email') ?? email
    } catch {
        // ignore
    }
    return {id: 'mock-user', email, username: email.split('@')[0], name: 'Mock User'}
}

// -----------------------
// Projects mocks
// -----------------------

export async function mockListProjects(): Promise<Project[]> {
    await delay(200)
    return mockProjects
}

export async function mockCreateProject(payload: {name: string; description?: string}): Promise<Project> {
    await delay(250)
    const next: Project = {
        id: mockProjects.length ? Math.max(...mockProjects.map((p) => Number(p.id) || 0)) + 1 : 1,
        name: payload.name,
        description: payload.description,
    }
    mockProjects = [next, ...mockProjects]
    return next
}

// -----------------------
// Tasks mocks
// -----------------------

export async function mockListTasks(): Promise<Task[]> {
    await delay(250)
    // Return shallow copy to avoid accidental external mutation.
    return mockTasks.map((t) => ({...t, images: getTaskImages(t).map((img) => ({...img}))}))
}

export async function mockCreateTask(payload: CreateTaskPayload): Promise<Task> {
    await delay(300)

    mockTaskSeq += 1
    const id = mockTaskSeq

    const imagesInput = payload.images ?? []
    const urls = payload.imageUrls ?? imagesInput.map((img) => img.url)
    const images: TaskImage[] = urls.map((url) => ({
        url,
        caption: undefined,
    }))

    const next: Task = {
        id,
        projectId: payload.projectId,
        status: 'open',
        images,
    }

    mockTasks = [next, ...mockTasks]
    return next
}

export async function mockSubmitTask(payload: SubmitTaskPayload): Promise<Task> {
    await delay(300)

    const taskId = payload.taskId ?? payload.id
    if (taskId === undefined || taskId === null) throw new Error('Mock submit: taskId is required')

    const idx = mockTasks.findIndex((t) => String(t.id) === String(taskId))
    if (idx < 0) throw new Error('Mock submit: task not found')

    const nextImages = mockTasks[idx].images ? [...mockTasks[idx].images] : []
    const updateByKey = new Map<string, string | undefined>()
    for (const img of payload.images ?? []) {
        const key = img.id !== undefined && img.id !== null ? String(img.id) : img.url
        updateByKey.set(key, img.caption)
    }

    for (const img of nextImages) {
        const key = img.id !== undefined && img.id !== null ? String(img.id) : img.url
        if (updateByKey.has(key)) img.caption = updateByKey.get(key)
    }

    mockTasks[idx] = {
        ...mockTasks[idx],
        status: 'completed',
        images: nextImages,
    }

    return mockTasks[idx]
}

// -----------------------
// Finance + analytics mocks
// -----------------------

export async function mockGetWallet(): Promise<WalletResponse> {
    await delay(150)
    return {balance: 1250.5, currency: 'USD'}
}

export async function mockGetDashboard(): Promise<DashboardResponse> {
    await delay(200)
    const stats = getTasksStats()
    return {
        ...stats,
        label: 'Mock analytics dashboard',
    } satisfies DashboardResponse
}

