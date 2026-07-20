"""Flove KB — CLI Query Tool.

Usage:
    python cli.py "What is confluentism?"
    python cli.py --mode answer "What is confluentism?"
    python cli.py --mode retrieve --top-k 5 "bipolar pairs"
    python cli.py --ingest
    python cli.py --ingest --reset
"""

import argparse
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.table import Table

console = Console()

KB_DIR = Path(__file__).resolve().parent


def cmd_ingest(args):
    from ingest import ingest
    stats = ingest(reset=args.reset)


def cmd_retrieve(args):
    from retrieve import retrieve

    results = retrieve(args.query, top_k=args.top_k, include_bipolar=not args.no_bipolar)

    console.print(Panel(f"[bold]{results['query']}[/bold]", title="Query", border_style="blue"))

    cats = ", ".join(c["name"] for c in results["detected_categories"])
    console.print(f"[dim]Detected categories: {cats}[/dim]")

    console.print(f"\n[bold]Context Chunks ({len(results['chunks'])})[/bold]")
    for i, chunk in enumerate(results["chunks"], 1):
        table = Table(show_header=True, box=None, padding=(0, 1))
        table.add_column("#", width=3)
        table.add_column("Source")
        table.add_column("Score", width=8)
        table.add_column("Category", width=15)
        table.add_row(str(i), chunk["citation"], f"{chunk['score']:.3f}", chunk["category"])
        console.print(table)

        # Truncate long text
        text = chunk["text"]
        if len(text) > 400:
            text = text[:400] + "..."
        console.print(f"   [dim]{text}[/dim]\n")

    if results["bipolar_pairs"]:
        console.print(f"[bold]Bipolar Pairs ({len(results['bipolar_pairs'])})[/bold]")
        for i, bp in enumerate(results["bipolar_pairs"], 1):
            console.print(f"   {i}. [yellow]{bp['pole_a']}[/yellow] <-> [yellow]{bp['pole_b']}[/yellow]")
            if bp["context"]:
                console.print(f"      [dim]{bp['context'][:200]}[/dim]")
            console.print(f"      [dim]Source: {bp['citation']}[/dim]")
        console.print()


def cmd_answer(args):
    from retrieve import retrieve
    from llm import answer as llm_answer

    console.print(Panel(f"[bold]{args.query}[/bold]", title="Query", border_style="blue"))
    console.print("[dim]Retrieving context...[/dim]")

    results = retrieve(args.query, top_k=args.top_k, include_bipolar=True)

    console.print(f"[dim]Found {len(results['chunks'])} context chunks, {len(results['bipolar_pairs'])} bipolar pairs[/dim]")

    if not args.api_key:
        import os
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            console.print("[red]No API key found. Set OPENAI_API_KEY or pass --api-key.[/red]")
            console.print("[dim]Or use 'retrieve' mode to get context without an LLM.[/dim]")
            sys.exit(1)
    else:
        import os
        os.environ["OPENAI_API_KEY"] = args.api_key

    backend_kwargs = {}
    if args.backend:
        backend_kwargs["backend_type"] = args.backend
    if args.model:
        backend_kwargs["model"] = args.model

    console.print("[dim]Generating answer...[/dim]")
    response = llm_answer(args.query, results["chunks"], **backend_kwargs)

    console.print(Panel(Markdown(response), title="Answer", border_style="green"))

    console.print("\n[dim]Sources:[/dim]")
    for chunk in results["chunks"][:3]:
        console.print(f"  - {chunk['citation']}")


def main():
    parser = argparse.ArgumentParser(description="Flove Knowledge Base CLI")
    parser.add_argument("query", nargs="?", help="Query to search or answer")
    parser.add_argument("--mode", choices=["retrieve", "answer"], default="retrieve", help="Operation mode")
    parser.add_argument("--top-k", type=int, default=8, help="Number of results to return")
    parser.add_argument("--no-bipolar", action="store_true", help="Skip bipolar pair search")
    parser.add_argument("--ingest", action="store_true", help="Run ingestion pipeline")
    parser.add_argument("--reset", action="store_true", help="Reset database during ingestion")
    parser.add_argument("--api-key", type=str, help="LLM API key (or set env var)")
    parser.add_argument("--backend", type=str, choices=["openai", "anthropic", "ollama"], help="LLM backend")
    parser.add_argument("--model", type=str, help="Model name for the chosen backend")

    args = parser.parse_args()

    if args.ingest:
        cmd_ingest(args)
        return

    if not args.query:
        parser.print_help()
        sys.exit(1)

    if args.mode == "retrieve":
        cmd_retrieve(args)
    elif args.mode == "answer":
        cmd_answer(args)


if __name__ == "__main__":
    main()
