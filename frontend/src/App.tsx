import { type FormEvent, useState } from "react"
import { Moon, Send, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type ChatMessage = {
	id: string
	role: "user" | "ai"
	content: string
}

const initialMessages: ChatMessage[] = [
	{
		id: "welcome",
		role: "ai",
		content:
			"Hello! I am QueryEase. What would you like to know about your database?",
	},
]

export default function App() {
	const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
	const [draft, setDraft] = useState("")
	const [isDark, setIsDark] = useState(false)

	const handleSend = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const trimmed = draft.trim()
		if (!trimmed) return

		setMessages((current) => [
			...current,
			{
				id: `user-${Date.now()}`,
				role: "user",
				content: trimmed,
			},
		])
		setDraft("")
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
								{messages.map((message) => {
									const isUser = message.role === "user"

									return (
										<div
											key={message.id}
											className={`flex ${
												isUser ? "justify-end" : "justify-start"
											}`}
										>
											<div
													className={`max-w-[75%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm transition-transform duration-300 hover:-translate-y-0.5 ${
														isUser
															? "border-zinc-200 bg-zinc-100/80 text-zinc-700 dark:border-zinc-700/70 dark:bg-zinc-800/70 dark:text-zinc-100"
															: "border-zinc-100 bg-white/90 text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-100"
													}`}
											>
													<p className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
													{isUser ? "You" : "QueryEase"}
												</p>
												<p className="mt-2 text-sm">{message.content}</p>
											</div>
										</div>
									)
								})}
							</div>
						</ScrollArea>

						<form
							onSubmit={handleSend}
							className="sticky bottom-6 flex w-full flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5 dark:border-zinc-800/80 dark:bg-zinc-950/80"
						>
							<div className="flex items-center gap-3">
								<Input
									value={draft}
									onChange={(event) => setDraft(event.target.value)}
									placeholder="Ask a question about your data..."
									className="h-12 rounded-xl border-zinc-200 bg-white/80 text-base text-zinc-800 shadow-sm placeholder:text-zinc-400 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-100/10"
								/>
								<Button
									type="submit"
									size="icon"
									className="h-12 w-12 rounded-full bg-zinc-900 text-white shadow-md hover:bg-zinc-800 dark:border dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
									aria-label="Send message"
								>
									<Send className="size-4" />
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
