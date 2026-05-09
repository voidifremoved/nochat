# Skill: Generate High-Fidelity Interactive HTML Visualizations

## Objective
When requested to explain complex architectural concepts, system topologies, or perform comparative technical analysis, do not output basic Markdown text or standard code blocks. Instead, generate a **single, self-contained, high-fidelity interactive HTML document** that provides a rich visual dashboard for the topic.

## Core Directives

1.  **Self-Contained File:**
    *   Output **only** raw HTML code starting with `<!DOCTYPE html>`. Do not output explanatory markdown before or after the code block.
    *   The HTML must include all CSS (via `<style>`), JavaScript (via `<script>`), and SVG graphics inline.
    *   Do not rely on external CDN links unless absolutely necessary (e.g., standard fonts like Inter/Roboto or specific rendering libraries if explicitly allowed, though pure vanilla JS/CSS/SVG is strongly preferred).

2.  **Layout and Aesthetics:**
    *   Use a modern, clean, dashboard-like aesthetic with ample whitespace, subtle borders, and soft shadows.
    *   Implement a responsive, fluid layout.
    *   Use standard, modern fonts (e.g., system-ui, Inter, San Francisco).
    *   Ensure high contrast and readability. Provide visually distinct sections.

3.  **Required Functional Elements:**
    Every generated HTML visualization must incorporate the following elements to ensure depth and interactivity:

    *   **Header / ADR Banner:** A clear title indicating the topic (e.g., an Architectural Decision Record format with "Status" badges).
    *   **TL;DR Summary Box:** A distinct, high-visibility container providing a concise executive summary and final recommendation.
    *   **Interactive Toggles / Tabs:** A control mechanism to switch between variants, strategies, or approaches (e.g., "K8s vs Hazelcast", "API Gateway vs Service Mesh").
    *   **Dynamic Visualizations (SVG):**
        *   Use inline `<svg>` for diagrams.
        *   Make diagrams interactive: clicking a node or edge should update a "Details/Inspector" pane.
        *   Include animations (e.g., dashed lines with `stroke-dashoffset` animation) to indicate traffic flow, data sync, or state changes.
    *   **Comprehensive Decision Matrices:** Do not use simple bullet points. Use CSS Grid or flexbox to create detailed comparison tables covering:
        *   Trade-offs (Pros/Cons)
        *   Failure Modes / Resilience
        *   Operational Complexity
        *   Use Cases
    *   **Deep-Dive Inspectors:** An interactive panel that updates based on the currently selected tab or clicked diagram node, providing:
        *   Detailed configuration examples (with syntax highlighting via CSS if possible).
        *   Specific architectural implications.

4.  **Content Depth & Density:**
    *   Do not skimp on technical detail. Assume the audience is a Senior Staff Engineer.
    *   Provide real-world context (e.g., "Memory overhead of gossip protocol" vs just "Uses more memory").
    *   Include realistic pseudo-code or configuration snippets (YAML, HOCON, JSON) relevant to the architecture.

## Example Workflow / Usage Scenario

**User Prompt:**
"Explain how event sourcing works compared to standard CRUD."

**Agent Action (Applying this Skill):**
1.  Generate a `<style>` block with a clean CSS reset and modern layout classes.
2.  Create a tabbed interface ("Event Sourcing" vs "CRUD state-mutation").
3.  Draw an SVG diagram for Event Sourcing showing the Event Store, Append-Only Log, and Read Models (CQRS). Add animations showing events flowing into the log and updating the read model.
4.  Draw an SVG diagram for CRUD showing standard database row updates.
5.  Build an inspector pane that shows the structure of an Event (JSON) when clicking the Append-Only Log in the diagram.
6.  Include a matrix comparing "Auditability", "Storage Growth", "Complexity", and "Query Performance".
7.  Output the final HTML block.

## Validation Checklist Before Outputting:
- [ ] Is it a single HTML file?
- [ ] Is there a TL;DR box?
- [ ] Are there interactive tabs or buttons?
- [ ] Are there animated SVG diagrams?
- [ ] Is there a detailed comparison matrix?
- [ ] Does clicking elements reveal deeper technical details?
- [ ] Did I remove all conversational filler (e.g., "Here is your HTML...")?