import { type ChangeEvent, type FormEvent, useRef, useState } from "react"
import axios from "axios"
import { Loader2, Moon, Send, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"

type QuerySuccessResponse = {
	status: string
	generated_sql: string
	execution_time_ms: number
	retries_used: number
	data: Array<Record<string, unknown>>
	inferred_chart_type: string
}

type ChatMessage = {
	id: string
	role: "user" | "assistant"
	content: string
	generated_sql?: string
	data?: Array<Record<string, unknown>>
	raw_response?: unknown // ADDED FOR DEBUGGING
}

const initialMessages: ChatMessage[] = [
	{
		id: "welcome",
		role: "assistant",
		content:
			"Hello! I am QueryEase. What would you like to know about your database?",
	},
]

const formatCellValue = (value: unknown) => {
	if (value === null || value === undefined) return ""
	if (typeof value === "object") return JSON.stringify(value)
	return String(value)
}

export default function App() {
	const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
	const [draft, setDraft] = useState("")
	const [isDark, setIsDark] = useState(false)
	const [isSending, setIsSending] = useState(false)
	const sessionIdRef = useRef(
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: `session-${Date.now()}`
	)
	const tenantId = "tenant-001"

	const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const trimmed = draft.trim()
		if (!trimmed || isSending) return

		const userMessage: ChatMessage = {
			id: `user-${Date.now()}`,
			role: "user",
			content: trimmed,
		}

		setMessages((current) => [...current, userMessage])
		setDraft("")
		setIsSending(true)

		try {
			const apiBaseUrl = import.meta.env.VITE_API_URL
			if (!apiBaseUrl) {
				throw new Error("VITE_API_URL is not configured.")
			}

			const response = await axios.post<QuerySuccessResponse[]>(
				`${apiBaseUrl}/api/v1/query`,
				{
					user_query: trimmed,
					session_id: sessionIdRef.current,
					tenant_id: tenantId,
				}
			)

			const payload = Array.isArray(response.data)
				? response.data[0]
				: response.data

			if (!payload) {
				throw new Error("No response payload returned by the API.")
			}

			const aiMessage: ChatMessage = {
				id: `assistant-${Date.now()}`,
				role: "assistant",
				content: payload.data && payload.data.length
					? "Here are the results."
					: "Query executed successfully.",
				generated_sql: payload.generated_sql,
				data: payload.data,
				raw_response: response.data, // CAPTURING EXACT API OUTPUT
			}

			setMessages((current) => [...current, aiMessage])
		} catch (error) {
			const message = axios.isAxiosError(error)
				? error.response?.data?.error_message ??
						error.response?.data?.detail?.error_message ??
						error.message
				: error instanceof Error
					? error.message
					: "Unexpected error."

			setMessages((current) => [
				...current,
				{
					id: `assistant-${Date.now()}`,
					role: "assistant",
					content: `Request failed: ${message}`,
				},
			])
		} finally {
			setIsSending(false)
		}
	}

	return (
		<div
			className={`theme min-h-screen font-sans transition-colors duration-300 ${
				isDark
					? "dark bg-zinc-950 text-zinc-50"
					: "bg-zinc-100 text-zinc-900"
			}`}
		>
			<div className="relative min-h-screen">
				<div className="pointer-events-none absolute inset-0">
					<div
						className={`absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(251,146,60,0.18),transparent_60%),radial-gradient(850px_circle_at_85%_0%,rgba(251,113,133,0.14),transparent_55%),linear-gradient(180deg,rgba(244,238,230,0.96),rgba(250,248,245,0.96))] transition-opacity duration-700 ${
							isDark ? "opacity-0" : "opacity-100"
						}`}
					/>
					<div
						className={`absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(251,146,60,0.14),transparent_55%),radial-gradient(800px_circle_at_85%_-10%,rgba(251,113,133,0.12),transparent_45%),linear-gradient(180deg,rgba(9,9,11,0.98),rgba(24,24,27,0.96))] transition-opacity duration-700 ${
							isDark ? "opacity-100" : "opacity-0"
						}`}
					/>
				</div>

				<div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-8 pb-10 pt-12">
					<header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-500">
								QueryEase
							</p>
							<h1 className="mt-3 text-4xl font-semibold text-zinc-900 sm:text-5xl dark:text-white">
								Privacy-first Text-to-SQL chat
							</h1>
							<p className="mt-3 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
								Ask questions in plain language. QueryEase injects your live schema
								and runs safe, deterministic SQL on your PostgreSQL data.
							</p>
						</div>
						<div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
							<span className="font-medium">Theme</span>
							<button
								type="button"
								role="switch"
								aria-checked={isDark}
								aria-label="Toggle dark mode"
								onClick={() => setIsDark((current) => !current)}
								className="relative flex h-8 w-14 items-center rounded-full border border-zinc-200 bg-white/80 p-1 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/70"
							>
								<Sun className="pointer-events-none absolute left-2 size-3 text-amber-500/80 transition-opacity duration-300 dark:opacity-0" />
								<Moon className="pointer-events-none absolute right-2 size-3 text-zinc-300/80 opacity-0 transition-opacity duration-300 dark:opacity-100" />
								<span
									className={`flex size-6 items-center justify-center rounded-full bg-white text-zinc-700 shadow transition-transform duration-300 ease-out dark:bg-zinc-900 dark:text-zinc-100 ${
										isDark ? "translate-x-6" : "translate-x-0"
									}`}
								>
									{isDark ? <Moon className="size-3" /> : <Sun className="size-3" />}
								</span>
							</button>
						</div>
					</header>

					<main className="flex min-h-0 flex-1 flex-col gap-6">
						<ScrollArea className="flex-1 rounded-3xl border border-zinc-100 bg-white/70 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950/70 dark:shadow-[0_0_30px_rgba(251,146,60,0.12)]">
							<div className="flex flex-col gap-4 p-6">
								{messages.map((msg) => {
									const isUser = msg.role === "user"
									const hasData = !isUser && Array.isArray(msg.data)
									const hasRows = Boolean(msg.data?.length)
									const columns = hasRows
										? Object.keys(msg.data?.[0] ?? {})
										: []

									return (
										<div
											key={msg.id}
											className={`flex ${
												isUser ? "justify-end" : "justify-start"
											}`}
										>
											<div
												className={`flex w-full max-w-[85%] flex-col gap-3 ${
													isUser ? "items-end" : "items-start"
												}`}
											>
												<div
													className={`max-w-[75%] w-full rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm transition-transform duration-300 hover:-translate-y-0.5 ${
														isUser
															? "border-zinc-200 bg-zinc-100/80 text-zinc-700 dark:border-zinc-700/70 dark:bg-zinc-800/70 dark:text-zinc-100"
															: "border-zinc-100 bg-white/90 text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-100"
													}`}
												>
													<p className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
														{isUser ? "You" : "Assistant"}
													</p>
													<p className="mt-2 text-sm">{msg.content}</p>
													
													{!isUser && msg.generated_sql ? (
														<details className="mt-3">
															<summary className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
																View SQL
															</summary>
															<pre className="mt-2 whitespace-pre-wrap rounded-xl border border-zinc-200/80 bg-white/80 p-3 text-xs text-zinc-600 dark:border-zinc-700/70 dark:bg-zinc-900/70 dark:text-zinc-200">
																{msg.generated_sql}
															</pre>
														</details>
													) : null}

													{hasData && msg.data?.length === 0 ? (
														<p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
															No results found in database.
														</p>
													) : null}
													{hasRows && columns.length ? (
														<div className="mt-3 w-full overflow-hidden rounded-xl border border-zinc-200/80 bg-white/80 text-xs text-zinc-700 dark:border-zinc-700/70 dark:bg-zinc-900/70 dark:text-zinc-200">
															<div className="max-h-56 overflow-auto">
																<Table>
																	<TableHeader>
																		<TableRow>
																			{columns.map((column) => (
																				<TableHead key={column}>{column}</TableHead>
																			))}
																		</TableRow>
																	</TableHeader>
																	<TableBody>
																		{msg.data?.map((row, rowIndex) => (
																			<TableRow key={`row-${msg.id}-${rowIndex}`}>
																				{columns.map((column) => (
																					<TableCell key={`${rowIndex}-${column}`}>
																						{formatCellValue(row[column])}
																					</TableCell>
																				))}
																			</TableRow>
																		))}
																	</TableBody>
																</Table>
															</div>
														</div>
													) : null}
												</div>
											</div>
										</div>
									)
								})}
							</div>
						</ScrollArea>

						<form
							onSubmit={handleSendMessage}
							aria-busy={isSending}
							className="sticky bottom-6 flex w-full flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5 dark:border-zinc-800/80 dark:bg-zinc-950/80"
						>
							<div className="flex items-center gap-3">
								<Input
									value={draft}
									onChange={(event: ChangeEvent<HTMLInputElement>) =>
										setDraft(event.target.value)
									}
									placeholder="Ask a question about your data..."
									disabled={isSending}
									className="h-12 rounded-xl border-zinc-200 bg-white/80 text-base text-zinc-800 shadow-sm placeholder:text-zinc-400 focus-visible:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-100/10"
								/>
								<Button
									type="submit"
									size="icon"
									disabled={isSending || !draft.trim()}
									className="h-12 w-12 rounded-full bg-zinc-900 text-white shadow-md hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:border dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
									aria-label="Send message"
								>
										{isSending ? (
											<Loader2 className="size-4 animate-spin" />
										) : (
											<Send className="size-4" />
										)}
								</Button>
							</div>
							<div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
								<span>Schema-aware responses. Private by design.</span>
								<span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
									<span className="size-2 rounded-full bg-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.35)] transition-opacity duration-300 motion-safe:animate-pulse dark:bg-emerald-400/70" />
									Connected
								</span>
							</div>
						</form>
					</main>
				</div>
			</div>
		</div>
	)
}