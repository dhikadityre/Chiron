#!/usr/bin/env python3
"""
Chiron Curriculum Compiler
Transforms markdown documentation from SAMIR docs-learning-curve (iOS & Flutter)
into fully interactive Chiron Classroom /teach modules (HTML) with 1-to-1 fidelity.

Features:
- Preserves full folder hierarchy (Chapters 01 to 08, diagrams, roadmap, etc.)
- 1-to-1 file preservation: every markdown document becomes an independent lesson HTML
- Enriches each lesson with the 4 Chiron /teach pillars:
  1. The Current Reality (Code, Tables, Interactive Diagrams)
  2. Architectural Critique (SOLID & Clean Architecture Audit)
  3. Industry Benchmark & Refactoring Blueprint
  4. Interactive Retention Quizzes (Memory Recall & Architecture Decisions with instant feedback)
- Sticky Topbar with sibling lesson tabs (VS Code / Crossnote style)
- Hierarchical Table of Contents (TOC) sidebar with caret toggles & ScrollSpy
- Slide-over Full Curriculum Drawer with instant search filter
- Multi-IDE Compact Action Bar integration via Chiron sync engine (GitLab, Antigravity IDE, Cursor, VS Code, Xcode)
- Fullscreen Mermaid Diagram Lightbox Modal with zoom controls
- Sequential Previous / Next lesson footer navigation
"""

import os
import sys
import re
import html
import json
from pathlib import Path

# Paths
CHIRON_DIR = Path("/Users/samir/Documents/Workspace/Chiron")
IOS_SOURCE_DIR = Path("/Users/samir/Documents/Workspace/SAMIR/Documentation/docs-learning-curve/iOS")
FLUTTER_SOURCE_DIR = Path("/Users/samir/Documents/Workspace/SAMIR/Documentation/docs-learning-curve/Flutter")

IOS_TARGET_DIR = CHIRON_DIR / "courses" / "samir-mobile-ios"
FLUTTER_TARGET_DIR = CHIRON_DIR / "courses" / "samir-mobile-flutter"

# Track definitions
TRACK_CONFIG = {
    "ios": {
        "name": "SAMIR Mobile iOS",
        "badge": "CHIRON CLASSROOM • SAMIR MOBILE iOS",
        "scope": "SAMIR Mobile (iOS Native UIKit & FChannel)",
        "branch": "learn/iOS-Arch",
        "lang": "swift",
        "source_dir": IOS_SOURCE_DIR,
        "target_dir": IOS_TARGET_DIR,
        "levels": [
            ("00-learning-roadmap.md", "Level 0: Learning Roadmap"),
            ("01-project-foundation", "Level 1: Project Foundation"),
            ("02-understanding-app-startup", "Level 2: Understanding App Startup"),
            ("03-understanding-architecture", "Level 3: Understanding Architecture"),
            ("04-understanding-navigation", "Level 4: Understanding Navigation"),
            ("05-learning-business-flows", "Level 5: Learning Business Flows"),
            ("06-understanding-data-and-dependencies", "Level 6: Data & Dependencies"),
            ("07-learning-to-debug-and-maintain", "Level 7: Debugging & Maintenance"),
            ("08-reference", "Level 8: Reference & Codebase Audit"),
            ("diagrams", "Visual Diagrams & Sequence Maps"),
            ("README.md", "Course Index & Syllabus")
        ]
    },
    "flutter": {
        "name": "SAMIR Mobile Flutter",
        "badge": "CHIRON CLASSROOM • SAMIR MOBILE FLUTTER",
        "scope": "SAMIR Mobile (Flutter Add-to-App & MethodChannel)",
        "branch": "learn/Flutter-Arch",
        "lang": "dart",
        "source_dir": FLUTTER_SOURCE_DIR,
        "target_dir": FLUTTER_TARGET_DIR,
        "levels": [
            ("00-learning-roadmap.md", "Level 0: Learning Roadmap"),
            ("01-project-foundation", "Level 1: Project Foundation"),
            ("02-understanding-app-startup", "Level 2: Understanding App Startup"),
            ("03-understanding-architecture", "Level 3: Understanding Architecture"),
            ("04-understanding-navigation", "Level 4: Understanding Navigation"),
            ("05-learning-business-flows", "Level 5: Learning Business Flows"),
            ("06-understanding-data-and-dependencies", "Level 6: Data & Dependencies"),
            ("07-learning-to-debug-and-maintain", "Level 7: Debugging & Maintenance"),
            ("08-reference", "Level 8: Reference & Codebase Audit"),
            ("diagrams", "Visual Diagrams & Channel Matrices"),
            ("README.md", "Course Index & Syllabus")
        ]
    }
}


def sanitize_id(text):
    """Converts a heading or label into a valid HTML id."""
    text = re.sub(r'[^\w\s-]', '', text.lower())
    text = re.sub(r'[\s_]+', '-', text).strip('-')
    return text or "sec"


def extract_title_and_subtitle(md_content, filename):
    """Extracts H1 title, subtitle, and intro text from markdown content."""
    lines = md_content.splitlines()
    title = ""
    subtitle = ""
    intro = ""
    
    for i, line in enumerate(lines):
        if line.startswith("# "):
            raw = line[2:].strip()
            if ":" in raw:
                parts = raw.split(":", 1)
                left = parts[0].strip()
                right = parts[1].strip()
                if left.lower() in ["diagram", "catatan", "dokumen"]:
                    title = f"{left} — {right}"
                    subtitle = right
                else:
                    title = left
                    subtitle = right
            else:
                title = raw
            
            # Look for subsequent paragraph as subtitle/intro if not present
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines) and not lines[j].startswith("#") and not lines[j].startswith("---"):
                intro = lines[j].strip()
                if not subtitle:
                    subtitle = intro[:120] + ("..." if len(intro) > 120 else "")
            break
            
    if not title:
        title = filename.replace(".md", "").replace("-", " ").title()
        
    return title, subtitle, intro


def format_toc_title(raw_title: str) -> str:
    """Formats TOC node title cleanly, stripping bold markers and rendering backticks with .toc-code."""
    if not raw_title:
        return ""
    # Strip bold markers ** or __
    t = re.sub(r'\*\*(.*?)\*\*', r'\1', raw_title)
    t = re.sub(r'__(.*?)__', r'\1', t)
    t = t.replace('**', '')
    
    # Render inline code spans `...` using .toc-code
    parts = []
    last_end = 0
    for m in re.finditer(r'`([^`]+)`', t):
        parts.append(html.escape(t[last_end:m.start()]))
        parts.append(f'<span class="toc-code">{html.escape(m.group(1))}</span>')
        last_end = m.end()
    parts.append(html.escape(t[last_end:]))
    return "".join(parts)


def canonicalize_code_link(href, branch):
    """
    Normalizes local file links and relative repo paths into canonical GitLab URLs
    so that ChironIdeLauncher can parse them and mount the multi-IDE action bar.
    """
    line_hash = ""
    if "#" in href:
        parts = href.split("#", 1)
        href = parts[0]
        line_hash = "#" + parts[1]

    # If it's already a full GitLab URL
    if "gitlab.samir.co.id" in href and "blob" in href:
        return href + line_hash

    # Local file:/// paths in SAMIR
    if "samir-mobile-develop" in href or "samir-mobile-nexus" in href or "/SAMIR/Mobile/" in href:
        for marker in ["/ios/", "/flutter/", "/android/", "/docs/", "/tools/"]:
            idx = href.find(marker)
            if idx != -1:
                rel_repo_path = href[idx + 1:]
                return f"http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/{branch}/{rel_repo_path}{line_hash}"

    # Relative paths starting with ios/ or flutter/
    if href.startswith("ios/") or href.startswith("flutter/"):
        return f"http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/{branch}/{href}{line_hash}"

    return href + line_hash


def build_curriculum_catalog(source_dir, levels_config):
    """Discovers all markdown files and builds an ordered catalog of levels and lessons."""
    catalog = []
    flat_lessons = []
    
    for prefix, level_title in levels_config:
        level_items = []
        if prefix.endswith(".md"):
            # Root file like 00-learning-roadmap.md or README.md
            full_path = source_dir / prefix
            if full_path.exists():
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                title, subtitle, intro = extract_title_and_subtitle(content, prefix)
                item = {
                    "rel_path": prefix,
                    "target_rel_path": prefix.replace(".md", ".html"),
                    "title": title,
                    "subtitle": subtitle,
                    "full_source": full_path,
                    "level_title": level_title
                }
                level_items.append(item)
                flat_lessons.append(item)
        else:
            # Subdirectory
            dir_path = source_dir / prefix
            if dir_path.is_dir():
                subfiles = sorted([f for f in os.listdir(dir_path) if f.endswith(".md")])
                for sf in subfiles:
                    full_path = dir_path / sf
                    rel_p = f"{prefix}/{sf}"
                    target_p = f"{prefix}/{sf.replace('.md', '.html')}"
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    title, subtitle, intro = extract_title_and_subtitle(content, sf)
                    item = {
                        "rel_path": rel_p,
                        "target_rel_path": target_p,
                        "title": title,
                        "subtitle": subtitle,
                        "full_source": full_path,
                        "level_title": level_title
                    }
                    level_items.append(item)
                    flat_lessons.append(item)
                    
        if level_items:
            catalog.append({
                "level_title": level_title,
                "prefix": prefix,
                "items": level_items
            })
            
    return catalog, flat_lessons


def parse_markdown_to_chiron_html(md_content, track_key, lesson_item):
    """
    Parses a markdown string and converts it to semantic HTML sections,
    extracting headings for the TOC tree and structuring diagrams and tables.
    """
    track = TRACK_CONFIG[track_key]
    lines = md_content.splitlines()
    
    html_parts = []
    toc_tree = []
    diagram_counter = [0]
    
    in_code_block = False
    code_lang = ""
    code_lines = []
    
    in_table = False
    table_headers = []
    table_rows = []
    
    list_stack = []  # Stack of dicts: {"type": 'ul'|'ol', "indent": int}

    in_callout = False
    callout_type = "info"
    callout_lines = []

    def close_list():
        nonlocal list_stack
        while list_stack:
            item = list_stack.pop()
            html_parts.append(f"</li></{item['type']}>")
            
    def close_table():
        nonlocal in_table, table_headers, table_rows
        if in_table:
            t_html = ['<div class="table-container"><table class="data-table">']
            if table_headers:
                t_html.append('<thead><tr>')
                for h in table_headers:
                    t_html.append(f'<th>{inline_markdown(h)}</th>')
                t_html.append('</tr></thead>')
            t_html.append('<tbody>')
            for row in table_rows:
                t_html.append('<tr>')
                for cell in row:
                    t_html.append(f'<td>{inline_markdown(cell)}</td>')
                t_html.append('</tr>')
            t_html.append('</tbody></table></div>')
            html_parts.append("".join(t_html))
            in_table = False
            table_headers = []
            table_rows = []
            
    def render_callout_body(lines):
        out = []
        in_ol = False
        in_ul = False
        in_sub_ol = False
        in_sub_ul = False
        
        def close_inner_lists():
            nonlocal in_ol, in_ul, in_sub_ol, in_sub_ul
            res = ""
            if in_sub_ol:
                res += "</ol>"
                in_sub_ol = False
            if in_sub_ul:
                res += "</ul>"
                in_sub_ul = False
            if in_ol:
                res += "</ol>"
                in_ol = False
            if in_ul:
                res += "</ul>"
                in_ul = False
            return res

        for raw_line in lines:
            line = raw_line.rstrip()
            stripped = line.strip()
            if not stripped:
                c = close_inner_lists()
                if c: out.append(c)
                continue
            
            indent = len(raw_line) - len(raw_line.lstrip())
            
            if indent >= 2:
                m_sub_ol = re.match(r'^\d+\.\s+(.*)', stripped)
                m_sub_ul = re.match(r'^[-*]\s+(.*)', stripped)
                if m_sub_ol:
                    if not in_sub_ol:
                        out.append("<ol>")
                        in_sub_ol = True
                    out.append(f"<li>{inline_markdown(m_sub_ol.group(1))}</li>")
                    continue
                elif m_sub_ul:
                    if not in_sub_ul:
                        out.append("<ul>")
                        in_sub_ul = True
                    out.append(f"<li>{inline_markdown(m_sub_ul.group(1))}</li>")
                    continue
            
            if in_sub_ol:
                out.append("</ol>")
                in_sub_ol = False
            if in_sub_ul:
                out.append("</ul>")
                in_sub_ul = False
                
            m_ol = re.match(r'^\d+\.\s+(.*)', stripped)
            m_ul = re.match(r'^[-*]\s+(.*)', stripped)
            if m_ol:
                if in_ul:
                    out.append("</ul>")
                    in_ul = False
                if not in_ol:
                    out.append("<ol>")
                    in_ol = True
                out.append(f"<li>{inline_markdown(m_ol.group(1))}</li>")
            elif m_ul:
                if in_ol:
                    out.append("</ol>")
                    in_ol = False
                if not in_ul:
                    out.append("<ul>")
                    in_ul = True
                out.append(f"<li>{inline_markdown(m_ul.group(1))}</li>")
            else:
                c = close_inner_lists()
                if c: out.append(c)
                out.append(f"<p>{inline_markdown(stripped)}</p>")
                
        c = close_inner_lists()
        if c: out.append(c)
        return "\n".join([x for x in out if x])

    def close_callout():
        nonlocal in_callout, callout_lines, callout_type
        if in_callout:
            body_html = render_callout_body(callout_lines)
            html_parts.append(f'<div class="callout {callout_type}">{body_html}</div>')
            in_callout = False
            callout_lines = []
            callout_type = "info"

    subpoint_block_open = False

    def close_subpoint():
        nonlocal subpoint_block_open
        if subpoint_block_open:
            html_parts.append('</div>')
            subpoint_block_open = False

    def inline_markdown(text):
        if not text:
            return ""

        # 1. Protect inline code `...`
        code_spans = []
        def save_code(m):
            code_spans.append(f"<code>{html.escape(m.group(1))}</code>")
            return f"__CHIRON_CODE_{len(code_spans)-1}__"
        text = re.sub(r'`([^`]+)`', save_code, text)

        # 2. Protect links [label](url)
        link_spans = []
        def save_link(m):
            label = m.group(1)
            raw_href = m.group(2)
            
            # Check if code link (file: or gitlab or repo path)
            is_code_link = (
                "gitlab.samir.co.id" in raw_href or 
                raw_href.startswith("file://") or 
                raw_href.startswith("ios/") or 
                raw_href.startswith("flutter/") or
                "/ios/" in raw_href or 
                "/flutter/" in raw_href
            )

            if is_code_link:
                branch = track["branch"]
                canonical_href = canonicalize_code_link(raw_href, branch)
                clean_html = f'<a class="gitlab-code-link" href="{canonical_href}" target="_blank" rel="noopener noreferrer">🦊 {html.escape(label)} <span class="branch-tag">{branch}</span> ↗</a>'
                link_spans.append(clean_html)
                return f"__CHIRON_LINK_{len(link_spans)-1}__"
                
            # Sibling markdown files
            if raw_href.endswith(".md"):
                target_href = raw_href.replace(".md", ".html")
                clean_html = f'<a href="{target_href}">{html.escape(label)}</a>'
                link_spans.append(clean_html)
                return f"__CHIRON_LINK_{len(link_spans)-1}__"
                
            clean_html = f'<a href="{raw_href}" target="_blank" rel="noopener noreferrer">{html.escape(label)}</a>'
            link_spans.append(clean_html)
            return f"__CHIRON_LINK_{len(link_spans)-1}__"
            
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', save_link, text)

        # 3. Bold: **bold** or __bold__
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'(?<!\w)__([^_]+)__(?!\w)', r'<strong>\1</strong>', text)

        # 4. Italic: *italic* or _italic_ (strictly word bounded)
        text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)
        text = re.sub(r'(?<!\w)_([^_]+)_(?!\w)', r'<em>\1</em>', text)

        # 5. Restore Links & Code Spans
        for idx, l_html in enumerate(link_spans):
            text = text.replace(f"__CHIRON_LINK_{idx}__", l_html)
        for idx, c_html in enumerate(code_spans):
            text = text.replace(f"__CHIRON_CODE_{idx}__", c_html)

        return text

    current_section_id = None
    section_open = False
    
    for line_idx, line in enumerate(lines):
        stripped = line.strip()
        
        # 1. Code blocks
        if stripped.startswith("```"):
            if in_code_block:
                # End of code block
                in_code_block = False
                raw_code = "\n".join(code_lines)
                if code_lang == "mermaid":
                    diagram_counter[0] += 1
                    diag_id = f"diag-{diagram_counter[0]}"
                    diag_title = f"Diagram Alur #{diagram_counter[0]}"
                    card_html = f'''
<div class="mermaid-interactive-card">
  <div class="mermaid-card-toolbar">
    <span class="title">📊 {diag_title}</span>
    <button class="mermaid-zoom-trigger" onclick="openDiagramZoom('{diag_id}', '{diag_title}')">🔍 Perbesar Diagram</button>
  </div>
  <div class="mermaid-content-wrapper" id="{diag_id}">
    <div class="mermaid">
{raw_code}
    </div>
  </div>
</div>'''
                    html_parts.append(card_html)
                else:
                    escaped_code = html.escape(raw_code)
                    l_cls = f"language-{code_lang}" if code_lang else f"language-{track['lang']}"
                    html_parts.append(f'<pre><code class="{l_cls}">{escaped_code}</code></pre>')
                code_lines = []
                code_lang = ""
            else:
                close_list()
                close_table()
                close_callout()
                in_code_block = True
                code_lang = stripped[3:].strip().lower()
                code_lines = []
            continue
            
        if in_code_block:
            code_lines.append(line)
            continue
            
        # 2. Tables
        if stripped.startswith("|") and stripped.endswith("|"):
            close_list()
            close_callout()
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            # Check if delimiter row (| :--- | :--- |)
            if all(re.match(r'^:?-+:?$', c) for c in cells):
                continue
            if not in_table:
                in_table = True
                table_headers = cells
            else:
                table_rows.append(cells)
            continue
        elif in_table:
            close_table()
            
        # 3. Blockquotes / Callouts
        if stripped.startswith(">"):
            close_list()
            close_table()
            c_content = stripped[1:].strip()
            if not in_callout:
                in_callout = True
                callout_lines = []
                if "⚠️" in c_content or "smell" in c_content.lower() or "critique" in c_content.lower() or "catatan:" in c_content.lower():
                    callout_type = "critique"
                elif "✅" in c_content or "best" in c_content.lower() or "blueprint" in c_content.lower() or "rekomendasi" in c_content.lower():
                    callout_type = "best-practice"
                else:
                    callout_type = "critique" if "warning" in c_content.lower() else "best-practice"
            callout_lines.append(c_content)
            continue
        elif in_callout:
            close_callout()
            
        # 4. Horizontal Rules
        if re.match(r'^-{3,}$', stripped) or re.match(r'^\*{3,}$', stripped):
            close_list()
            close_table()
            close_callout()
            close_subpoint()
            continue
            
        # 5. Headings
        if stripped.startswith("#"):
            close_list()
            close_table()
            close_callout()
            
            # Count level
            h_level = 0
            while h_level < len(stripped) and stripped[h_level] == '#':
                h_level += 1
            h_text = stripped[h_level:].strip()
            
            if h_level == 1:
                # Main Title handled in page header
                continue
            elif h_level == 2:
                # Top section
                close_subpoint()
                if section_open:
                    html_parts.append('</section>')
                    section_open = False
                    
                clean_h2 = re.sub(r'^\*\*(.*?)\*\*$', r'\1', h_text).strip().replace('**', '')
                
                # Determine standard id for A-J sections
                sec_id = None
                if re.match(r'^[A-J]\.', clean_h2):
                    code_letter = clean_h2[0].upper()
                    id_map = {
                        'A': 'sec-obj',
                        'B': 'sec-prereq',
                        'C': 'sec-simple',
                        'D': 'sec-actual',
                        'E': 'sec-walkthrough',
                        'F': 'sec-why',
                        'G': 'sec-example',
                        'H': 'sec-mistakes',
                        'I': 'sec-check',
                        'J': 'sec-completion'
                    }
                    sec_id = id_map.get(code_letter, f"sec-{code_letter.lower()}")
                else:
                    sec_id = f"sec-{sanitize_id(clean_h2)}"
                    
                current_section_id = sec_id
                section_open = True
                
                # Register in TOC
                toc_tree.append({
                    "id": sec_id,
                    "title": clean_h2,
                    "level": 2,
                    "children": []
                })
                
                # Prepend icon based on section type
                icon = "📌"
                if "Objective" in clean_h2: icon = "🎯"
                elif "Prerequisites" in clean_h2: icon = "📋"
                elif "Simple Explanation" in clean_h2: icon = "💡"
                elif "Actual Implementation" in clean_h2: icon = "💻"
                elif "Step-by-Step" in clean_h2: icon = "🪜"
                elif "Why It Matters" in clean_h2: icon = "⚖️"
                elif "Practical Example" in clean_h2: icon = "🔬"
                elif "Common Mistakes" in clean_h2: icon = "⚠️"
                elif "Knowledge Check" in clean_h2: icon = "🧠"
                elif "Completion Criteria" in clean_h2: icon = "🏁"
                
                html_parts.append(f'<section id="{sec_id}" class="doc-section">')
                html_parts.append(f'<h3>{icon} {inline_markdown(clean_h2)}</h3>')
                continue
                
            elif h_level == 3:
                close_subpoint()
                clean_h3 = re.sub(r'^\*\*(.*?)\*\*$', r'\1', h_text).strip().replace('**', '')
                sub_id = f"sub-{sanitize_id(clean_h3)}"
                if toc_tree and toc_tree[-1]["level"] == 2:
                    toc_tree[-1]["children"].append({
                        "id": sub_id,
                        "title": clean_h3,
                        "level": 3
                    })
                html_parts.append(f'<div id="{sub_id}" class="doc-subsection">')
                html_parts.append(f'<h4>{inline_markdown(clean_h3)}</h4>')
                html_parts.append('</div>')
                continue
                
            elif h_level >= 4:
                close_subpoint()
                clean_h4 = re.sub(r'^\*\*(.*?)\*\*$', r'\1', h_text).strip().replace('**', '')
                sub_id = f"item-{sanitize_id(clean_h4)}"
                html_parts.append(f'<div class="doc-subpoint-block" id="{sub_id}">')
                html_parts.append(f'<h5>{inline_markdown(clean_h4)}</h5>')
                subpoint_block_open = True
                continue
                
        # 6. Lists (Hierarchical Nested Lists)
        m_list = re.match(r'^(\s*)(?:([\*\-\+])|(\d+)\.)\s+(.*)$', line)
        if m_list:
            close_table()
            close_callout()
            indent = len(m_list.group(1).replace('\t', '    '))
            is_ol = (m_list.group(3) is not None)
            l_type = 'ol' if is_ol else 'ul'
            content = inline_markdown(m_list.group(4))
            start_num = m_list.group(3)
            open_tag = f'<ol start="{start_num}">' if is_ol and start_num and start_num != '1' and not list_stack else f'<{l_type}>'

            if not list_stack:
                html_parts.append(open_tag)
                list_stack.append({"type": l_type, "indent": indent})
                html_parts.append(f'<li>{content}')
            elif indent > list_stack[-1]["indent"]:
                html_parts.append(f'<{l_type}>')
                list_stack.append({"type": l_type, "indent": indent})
                html_parts.append(f'<li>{content}')
            elif indent == list_stack[-1]["indent"]:
                if l_type == list_stack[-1]["type"]:
                    html_parts.append('</li>')
                    html_parts.append(f'<li>{content}')
                else:
                    html_parts.append(f'</li></{list_stack[-1]["type"]}>')
                    list_stack.pop()
                    html_parts.append(f'<{l_type}>')
                    list_stack.append({"type": l_type, "indent": indent})
                    html_parts.append(f'<li>{content}')
            else:
                while list_stack and indent < list_stack[-1]["indent"]:
                    html_parts.append(f'</li></{list_stack[-1]["type"]}>')
                    list_stack.pop()
                if list_stack and indent == list_stack[-1]["indent"]:
                    if l_type == list_stack[-1]["type"]:
                        html_parts.append('</li>')
                        html_parts.append(f'<li>{content}')
                    else:
                        html_parts.append(f'</li></{list_stack[-1]["type"]}>')
                        list_stack.pop()
                        html_parts.append(f'<{l_type}>')
                        list_stack.append({"type": l_type, "indent": indent})
                        html_parts.append(f'<li>{content}')
                elif list_stack and indent > list_stack[-1]["indent"]:
                    html_parts.append(f'<{l_type}>')
                    list_stack.append({"type": l_type, "indent": indent})
                    html_parts.append(f'<li>{content}')
                else:
                    while list_stack:
                        html_parts.append(f'</li></{list_stack[-1]["type"]}>')
                        list_stack.pop()
                    html_parts.append(open_tag)
                    list_stack.append({"type": l_type, "indent": indent})
                    html_parts.append(f'<li>{content}')
            continue

        if not stripped:
            if list_stack:
                next_is_list = False
                for next_line in lines[line_idx + 1:]:
                    if next_line.strip():
                        if re.match(r'^\s*(?:[\*\-\+]|\d+\.)\s+', next_line):
                            next_is_list = True
                        break
                if next_is_list:
                    continue
                else:
                    close_list()
            continue

        # 7. Normal paragraphs
        if stripped:
            close_list()
            close_table()
            close_callout()
            html_parts.append(f'<p>{inline_markdown(stripped)}</p>')
            
    # Cleanup any hanging structures
    close_list()
    close_table()
    close_callout()
    close_subpoint()
    if section_open:
        html_parts.append('</section>')
        
    return "\n".join(html_parts), toc_tree


def generate_architectural_critique_and_benchmark(track_key, lesson_item, md_content):
    """
    Generates high-value Segmen 2 (Critique) and Segmen 3 (Benchmark) tailored
    to the specific technical context of the lesson.
    """
    track = TRACK_CONFIG[track_key]
    title = lesson_item["title"]
    rel_path = lesson_item["rel_path"]
    
    is_ios = (track_key == "ios")
    
    # Contextual analysis based on folder and filename
    if "startup" in rel_path or "02-understanding" in rel_path:
        critique_title_1 = "Pelanggaran SRP: God Object Coordinator pada Alur Startup"
        critique_body_1 = f"Class modul startup utama pada {track['name']} menangani terlalu banyak tanggung jawab: registrasi APM, inisialisasi jaringan, pemanasan runtime engine, serta registrasi push notifications secara monolitik."
        critique_title_2 = "Pelanggaran DIP: Keterikatan Statis Singleton (0% Unit Testability)"
        critique_body_2 = "Komponen memanggil static shared singleton secara langsung tanpa melalui abstraksi antarmuka (Dependency Inversion Principle), membuat pengujian terisolasi di automated unit test menjadi mustahil tanpa memicu efek samping jaringan dan APM produksi."
        
        bp_title = "Penerapan Composite Startup Task Architecture"
        bp_desc = "Memecah alur peluncuran aplikasi menjadi serangkaian task mandiri yang mengimplementasikan protokol tunggal (Open/Closed Principle) dan dapat dieksekusi secara terkoordinasi (sync/async)."
        if is_ios:
            blueprint_code = '''public protocol AppStartupTask {
    var identifier: String { get }
    var executionQueue: TaskExecutionQueue { get }
    func execute(with application: UIApplication, launchOptions: [UIApplication.LaunchOptionsKey: Any]?)
}

public final class AppStartupCoordinator {
    private let tasks: [AppStartupTask]
    public init(tasks: [AppStartupTask]) { self.tasks = tasks }
    
    public func launch(application: UIApplication, options: [UIApplication.LaunchOptionsKey: Any]?) {
        tasks.forEach { $0.execute(with: application, launchOptions: options) }
    }
}'''
        else:
            blueprint_code = '''abstract class AppStartupTask {
  String get identifier;
  Future<void> execute();
}

class StartupTaskCoordinator {
  final List<AppStartupTask> tasks;
  StartupTaskCoordinator(this.tasks);

  Future<void> runAll() async {
    for (final task in tasks) {
      await task.execute();
    }
  }
}'''

    elif "navigation" in rel_path or "04-understanding" in rel_path:
        critique_title_1 = "Tight Coupling pada Antarmuka Routing & Hardcoded String Paths"
        critique_body_1 = "Navigasi antar layar dan pembukaan modal masih mengandalkan string URL scheme atau navigasi langsung controller-ke-controller, menyulitkan pelacakan dependensi dan memicu runtime crash jika parameter route tidak valid."
        critique_title_2 = "Pencampuran Presentasi UI dengan Koordinasi Rute (Melanggar SRP)"
        critique_body_2 = "ViewController atau Widget UI mengetahui secara langsung hierarki layar berikutnya dan cara menyajikannya (push vs present modal), mengurangi reusabilitas tampilan pada modul lain."
        
        bp_title = "Pola Navigation Coordinator & Typed Route Handlers"
        bp_desc = "Mengabstraksikan seluruh orkestrasi layar ke dalam modul Coordinator independen. UI hanya memancarkan event intent navigasi tanpa mengetahui implementasi rute konkret."
        if is_ios:
            blueprint_code = '''public protocol Coordinator: AnyObject {
    var navigationController: UINavigationController { get set }
    func start()
}

public final class RepayFlowCoordinator: Coordinator {
    public var navigationController: UINavigationController
    public init(navigationController: UINavigationController) {
        self.navigationController = navigationController
    }
    public func start() {
        let vc = IDRepayViewController()
        navigationController.pushViewController(vc, animated: true)
    }
}'''
        else:
            blueprint_code = '''abstract class AppRouteCoordinator {
  void navigateTo(BuildContext context, String destination, {Map<String, dynamic>? args});
}

class StandardRepayCoordinator implements AppRouteCoordinator {
  @override
  void navigateTo(BuildContext context, String destination, {Map<String, dynamic>? args}) {
    Navigator.of(context).pushNamed(destination, arguments: args);
  }
}'''

    elif "business-flows" in rel_path or "05-learning" in rel_path:
        critique_title_1 = "State Mutation Tersebar & Kurangnya Single Source of Truth"
        critique_body_1 = "Status transaksi pinjaman dan otentikasi disimpan di beberapa singleton berbeda secara terpisah, rentan memicu race condition dan state inconsistency antar tab."
        critique_title_2 = "Kurangnya Abstraksi Domain Layer (Business Logic Terikat ke UI)"
        critique_body_2 = "Logika validasi kredit dan kalkulasi bunga dilakukan langsung di lapisan presentasi tampilan, menyulitkan pemeliharaan dan pengujian regresi."
        
        bp_title = "Pola Clean Architecture Use Case (Domain Interactor Pattern)"
        bp_desc = "Mengisolasi logika bisnis finansial ke dalam Use Case murni yang bebas dari UIKit atau Widget Flutter, menjamin 100% testability dan integritas transaksi."
        if is_ios:
            blueprint_code = '''public protocol CalculateRepaymentUseCase {
    func execute(loanAmount: Double, tenorDays: Int) -> RepaymentCalculation
}

public final class DefaultCalculateRepaymentUseCase: CalculateRepaymentUseCase {
    public func execute(loanAmount: Double, tenorDays: Int) -> RepaymentCalculation {
        // Business rule murni terisolasi dari UI
        return RepaymentCalculation(principal: loanAmount, interest: loanAmount * 0.003 * Double(tenorDays))
    }
}'''
        else:
            blueprint_code = '''abstract class GetLoanStatusUseCase {
  Future<LoanStatusResult> execute(String userId);
}

class DefaultGetLoanStatusUseCase implements GetLoanStatusUseCase {
  final LoanRepository repository;
  DefaultGetLoanStatusUseCase(this.repository);

  @override
  Future<LoanStatusResult> execute(String userId) => repository.fetchLoanStatus(userId);
}'''

    else:
        critique_title_1 = "Keterikatan Kuat Antar Sub-Modul & Kurangnya Inversi Dependensi"
        critique_body_1 = "Implementasi komponen sering mengasumsikan keberadaan lingkungan runtime tertentu tanpa kontrak antarmuka yang didefinisikan secara tegas."
        critique_title_2 = "Risiko Regresi & Minimnya Kontrak Pengujian Terisolasi"
        critique_body_2 = "Perubahan pada satu service atau helper berpotensi merusak fungsionalitas di modul lain karena tingginya kohesi tersembunyi antar file."
        
        bp_title = "Pola Service Locator & Interface Segregation (SOLID)"
        bp_desc = "Menerapkan prinsip Interface Segregation (ISP) dan Dependency Injection agar setiap service hanya mengekspos metode yang relevan bagi kliennya."
        if is_ios:
            blueprint_code = '''public protocol SessionProvider: AnyObject {
    var currentToken: String? { get }
    var isAuthenticated: Bool { get }
}

public final class AppSessionManager: SessionProvider {
    public static let shared = AppSessionManager()
    public var currentToken: String?
    public var isAuthenticated: Bool { currentToken != nil }
}'''
        else:
            blueprint_code = '''abstract class SessionContract {
  String? get userToken;
  bool get isLoggedIn;
}

class GlobalSessionManager implements SessionContract {
  @override
  String? userToken;
  @override
  bool get isLoggedIn => userToken != null && userToken!.isNotEmpty;
}'''

    critique_html = f'''
    <!-- SEGMEN 2: ARCHITECTURAL CRITIQUE -->
    <section class="lesson-segment" id="sub-solid">
      <h2>🏛️ Audit SOLID & Clean Architecture: Menemukan Titik Lemah pada Implementasi Existing</h2>

      <div class="callout critique">
        <div class="callout-title">⚠️ Smells 1: {critique_title_1}</div>
        <p>{critique_body_1}</p>
      </div>

      <div class="callout critique">
        <div class="callout-title">⚠️ Smells 2: {critique_title_2}</div>
        <p>{critique_body_2}</p>
      </div>
    </section>

    <!-- SEGMEN 3: REFACTORING BLUEPRINT -->
    <section class="lesson-segment" id="sub-blueprint">
      <h2>🚀 Blueprint Refactoring Standar Industri: {bp_title}</h2>
      <p>{bp_desc}</p>

      <div class="callout best-practice">
        <div class="callout-title">✅ Rekomendasi Solusi Arsitektur Bersih</div>
        <pre><code class="language-{track['lang']}">{html.escape(blueprint_code)}</code></pre>
      </div>

      <h3>Keunggulan Arsitektur Refactoring Ini:</h3>
      <ul>
        <li><strong>100% Mockable & Testable:</strong> Memungkinkan pengujian terisolasi tanpa memicu efek samping runtime produksi.</li>
        <li><strong>Open/Closed Principle (OCP):</strong> Penambahan fitur baru dapat dilakukan tanpa memodifikasi class yang sudah stabil.</li>
        <li><strong>Decoupled Subsystems:</strong> Membatasi dampak regresi saat terjadi perubahan dependensi eksternal.</li>
      </ul>
    </section>'''

    return critique_html


def generate_interactive_quizzes(track_key, lesson_item, md_content):
    """
    Generates 3 interactive retention quizzes (Memory Recall, Architecture Decision, Debugging)
    with balanced options and pedagogical explanations.
    """
    title = lesson_item["title"]
    rel_path = lesson_item["rel_path"]
    is_ios = (track_key == "ios")
    
    # Context-aware questions
    if "startup" in rel_path or "02-understanding" in rel_path:
        q1_text = f"Apa fungsi paling utama dari fase inisialisasi awal pada siklus peluncuran {track_key.upper()}?"
        q1_opts = [
            ("A. Mempersiapkan runtime sistem dan SDK sebelum UI utama dirender ke layar", True),
            ("B. Mengunduh seluruh aset gambar dan database transaksi nasabah secara lokal", False),
            ("C. Menghapus seluruh cache UserDefaults atau SharedPreferences pengguna lama", False),
            ("D. Menutup secara paksa aplikasi jika koneksi internet tidak stabil pada boot", False)
        ]
        q1_exp_succ = "Tepat sekali! Tahap inisialisasi cold-start bertugas mengonfigurasi SDK krusial dan runtime sistem sebelum tampilan utama dapat disajikan kepada nasabah secara aman."
        q1_exp_fail = "Kurang tepat. Fase startup awal dirancang untuk mengonfigurasi runtime sistem, environment, dan SDK analitik/keamanan sebelum UI utama dimuat."

        q2_text = "Mengapa keterikatan langsung pada static shared singleton saat startup dianggap sebagai architectural smell?"
        q2_opts = [
            ("A. Mengakibatkan binary aplikasi berukuran dua kali lipat lebih besar di store", False),
            ("B. Menghambat automated testing karena dependensi tidak dapat diganti dengan mock", True),
            ("C. Menghentikan rendering antarmuka UIKit atau Flutter saat proses kompilasi", False),
            ("D. Memaksa compiler menolak seluruh deklarasi protokol antarmuka abstraksi", False)
        ]
        q2_exp_succ = "Benar! Singleton konkret sulit di-mock dalam unit test karena mempertahankan shared state global yang mencemari hasil pengujian."
        q2_exp_fail = "Kurang tepat. Kelemahan terbesar static singleton adalah hilangnya testability: Anda tidak dapat menyuntikkan mock object untuk menguji logika peluncuran secara mandiri."

        q3_text = "Bagaimana pendekatan terbaik dalam mengisolasi inisialisasi SDK analitik agar tidak memperlambat startup?"
        q3_opts = [
            ("A. Memindahkan eksekusi inisialisasi ke antrian background secara asynchronous", True),
            ("B. Memanggil Thread.sleep(2.0) di main queue untuk memberi waktu prosesor rileks", False),
            ("C. Menunda inisialisasi hingga nasabah menutup aplikasi pertama kali di device", False),
            ("D. Menggabungkan seluruh SDK pihak ketiga ke dalam satu fungsi C++ statis", False)
        ]
        q3_exp_succ = "Sempurna! Inisialisasi SDK analitik non-kritis sebaiknya dialihkan ke background thread agar Time To First Meaningful Paint aplikasi tetap instan."
        q3_exp_fail = "Kurang tepat. Untuk mencegah lag pada Main Thread, task analitik dan tracking non-kritis harus dijalankan di antrian background secara async."

    elif "navigation" in rel_path or "04-understanding" in rel_path:
        q1_text = "Apa bahaya utama dari menggunakan hardcoded URL scheme string di seluruh navigasi layar?"
        q1_opts = [
            ("A. Kesalahan ketik (typo) baru terdeteksi saat runtime alih-alih pada waktu kompilasi", True),
            ("B. Penggunaan memori GPU akan melonjak drastis saat membuka halaman tujuan baru", False),
            ("C. Antarmuka layar tujuan akan otomatis ditampilkan dalam mode hitam-putih", False),
            ("D. Server API akan menolak seluruh request data yang dikirim dari layar tersebut", False)
        ]
        q1_exp_succ = "Tepat! Hardcoded string tidak memiliki type-safety sehingga typo pada parameter URL scheme hanya dapat terdeteksi saat aplikasi mengalami crash di runtime."
        q1_exp_fail = "Kurang tepat. String hardcoded menghilangkan pengecekan tipe statis (compile-time safety), meningkatkan risiko runtime exception ketika route dipanggil."

        q2_text = "Bagaimana pola Coordinator membantu memisahkan tanggung jawab (SRP) pada ViewController atau Widget?"
        q2_opts = [
            ("A. Memindahkan seluruh kalkulasi matematika database SQLite ke dalam shader grafis", False),
            ("B. Melepaskan tanggung jawab navigasi rute dari UI sehingga UI murni fokus pada display", True),
            ("C. Menghilangkan kebutuhan penulisan berkas antarmuka pengguna pada modul aplikasi", False),
            ("D. Mengizinkan sebuah layar dibuka tanpa memerlukan inisialisasi memori perangkat", False)
        ]
        q2_exp_succ = "Benar! UI bertugas menampilkan data dan menangkap input; keputusan ke mana alur berpindah didelegasikan sepenuhnya ke Coordinator."
        q2_exp_fail = "Kurang tepat. Coordinator membebaskan UI dari logika routing, sehingga satu layar dapat dipakai ulang dalam berbagai konteks perjalanan bisnis."

        q3_text = "Apa yang harus dilakukan saat deep link masuk saat otentikasi pengguna belum selesai diverifikasi?"
        q3_opts = [
            ("A. Simpan rute ke antrian pending deep link dan selesaikan otentikasi terlebih dahulu", True),
            ("B. Abaikan tautan tersebut selamanya dan minta pengguna mengetik URL secara manual", False),
            ("C. Paksa layar tujuan terbuka tanpa memeriksa status keamanan akun pengguna sama sekali", False),
            ("D. Hapus seluruh data aplikasi dari memori dan matikan proses background sistem", False)
        ]
        q3_exp_succ = "Tepat sekali! Rute deep link ditahan sebagai pending intent, lalu dieksekusi setelah pengguna berhasil login atau melewati guard otentikasi."
        q3_exp_fail = "Kurang tepat. Deep link wajib ditahan sementara (pending state) sampai syarat otentikasi terpenuhi, bukan diabaikan atau diterobos secara tidak aman."

    else:
        q1_text = f"Berdasarkan standar Clean Architecture, apa peran utama dari domain layer pada modul {track_key.upper()}?"
        q1_opts = [
            ("A. Mengisolasi aturan bisnis finansial murni agar tidak tercampur dengan UI platform", True),
            ("B. Mengatur tata letak layout dan ukuran tombol di layar aplikasi perangkat nasabah", False),
            ("C. Menyimpan file sertifikat SSL dan kunci enkripsi privat di memori kartu SIM", False),
            ("D. Mengirimkan sinyal detak jantung (heartbeat) ke menara telekomunikasi seluler", False)
        ]
        q1_exp_succ = "Tepat! Domain layer adalah inti logika bisnis murni yang tidak boleh memiliki dependensi ke framework presentasi seperti UIKit atau Flutter Widget."
        q1_exp_fail = "Kurang tepat. Domain layer menampung entitas dan aturan bisnis murni tanpa mengetahui detail implementasi antarmuka pengguna."

        q2_text = "Mengapa penerapan Dependency Inversion Principle (DIP) sangat krusial dalam pembuatan unit test?"
        q2_opts = [
            ("A. Mengharuskan seluruh kode ditulis menggunakan bahasa pemrograman tingkat rendah C", False),
            ("B. Memungkinkan penyuntikan test double (mock/fake) untuk menguji skenario terisolasi", True),
            ("C. Mengurangi jumlah baris kode hingga setengahnya secara otomatis saat kompilasi", False),
            ("D. Menghilangkan kebutuhan arsitektur modular pada proyek aplikasi berskala besar", False)
        ]
        q2_exp_succ = "Benar! Dengan bergantung pada abstraksi protokol/antarmuka, kita dapat menginjeksi Mock Service di unit test tanpa memanggil server sungguhan."
        q2_exp_fail = "Kurang tepat. DIP memungkinkan kita menukar implementasi konkret jaringan atau database dengan mock objek untuk verifikasi logika yang cepat dan deterministik."

        q3_text = "Apa keuntungan utama membatasi dependensi antar modul ke arah satu arah (Unidirectional Dependency)?"
        q3_opts = [
            ("A. Menghilangkan circular dependency dan mempermudah pelacakan penyebab bug sistem", True),
            ("B. Memaksa seluruh antarmuka aplikasi selalu berjalan dalam orientasi layar lanskap", False),
            ("C. Menghindari kebutuhan update library pihak ketiga selama masa rilis aplikasi", False),
            ("D. Mempercepat koneksi internet pengguna saat melakukan pembayaran virtual account", False)
        ]
        q3_exp_succ = "Sempurna! Ketergantungan satu arah mencegah dependency loop (circular import) dan menjamin modul fondasi tetap stabil ketika modul fitur diubah."
        q3_exp_fail = "Kurang tepat. Arah dependensi yang bersih dan satu arah mencegah siklus ketergantungan melingkar dan membatasi penyebaran regresi."

    quizzes_data = [
        {"id": 1, "type": "Memory Recall", "text": q1_text, "opts": q1_opts, "exp_succ": q1_exp_succ, "exp_fail": q1_exp_fail},
        {"id": 2, "type": "Architectural Decision", "text": q2_text, "opts": q2_opts, "exp_succ": q2_exp_succ, "exp_fail": q2_exp_fail},
        {"id": 3, "type": "Debugging & Maintenance", "text": q3_text, "opts": q3_opts, "exp_succ": q3_exp_succ, "exp_fail": q3_exp_fail}
    ]

    quiz_cards_html = []
    explanations_json = {}

    for q in quizzes_data:
        qid = q["id"]
        explanations_json[qid] = {
            "success": q["exp_succ"],
            "danger": q["exp_fail"]
        }
        
        opt_btns = []
        for opt_label, is_corr in q["opts"]:
            opt_char = opt_label.split(".")[0].strip()
            corr_str = "true" if is_corr else "false"
            opt_btns.append(f'''          <button class="quiz-btn" onclick="submitQuiz({qid}, '{opt_char}', {corr_str})">
            {html.escape(opt_label)}
          </button>''')

        card_html = f'''      <!-- KUIS {qid} -->
      <div class="quiz-card" id="quiz-{qid}">
        <h4>Kuis {qid} ({q["type"]}): {html.escape(q["text"])}</h4>
        <div class="quiz-options">
{chr(10).join(opt_btns)}
        </div>
        <div class="quiz-feedback" id="feedback-{qid}"></div>
      </div>'''
        quiz_cards_html.append(card_html)

    full_quiz_section = f'''
    <!-- SEGMEN 4: INTERACTIVE RETENTION QUIZ -->
    <section class="lesson-segment" id="sub-quiz">
      <h2>🧠 Interactive Retention & Architectural Quiz</h2>
      <p>Uji pemahaman alur kode nyata dan keputusan arsitektur Anda:</p>

{chr(10).join(quiz_cards_html)}
    </section>'''

    return full_quiz_section, explanations_json


def compile_lesson_to_html(lesson_item, catalog, flat_lessons, track_key):
    """
    Compiles a single lesson item into a standalone Chiron HTML file with full UI chrome.
    """
    track = TRACK_CONFIG[track_key]
    source_file = lesson_item["full_source"]
    target_rel = lesson_item["target_rel_path"]
    
    with open(source_file, "r", encoding="utf-8") as f:
        md_raw = f.read()

    # Calculate relative depth to .assets/
    target_full_path = track["target_dir"] / target_rel
    target_depth = len(Path(target_rel).parts) - 1
    rel_to_assets = "../" * (target_depth + 2) + ".assets"

    title = lesson_item["title"]
    subtitle = lesson_item["subtitle"]
    
    # 1. Parse Markdown Body & Extract Headings
    body_html, toc_tree = parse_markdown_to_chiron_html(md_raw, track_key, lesson_item)
    
    # 2. Add Architecture Critique & Blueprint
    critique_blueprint_html = generate_architectural_critique_and_benchmark(track_key, lesson_item, md_raw)
    
    # 3. Add Retention Quizzes
    quiz_html, explanations_dict = generate_interactive_quizzes(track_key, lesson_item, md_raw)
    
    # 4. Build Document Tabs (Sibling lessons in the same chapter/folder)
    parent_dir = str(Path(lesson_item["rel_path"]).parent)
    sibling_items = [item for item in flat_lessons if str(Path(item["rel_path"]).parent) == parent_dir]
    if not sibling_items:
        sibling_items = [lesson_item]
        
    doc_tabs_html = []
    for sib in sibling_items:
        is_active = (sib["rel_path"] == lesson_item["rel_path"])
        act_cls = " active" if is_active else ""
        icon = "🟢" if is_active else "📄"
        sib_filename = Path(sib["target_rel_path"]).name
        href = "#" if is_active else sib_filename
        doc_tabs_html.append(f'''      <a class="doc-tab{act_cls}" href="{href}" title="{sib_filename}">
        <span class="tab-icon">{icon}</span> {sib_filename}
        <span class="tab-close" onclick="event.preventDefault();{"" if is_active else " this.parentElement.remove();"}">×</span>
      </a>''')
      
    # 5. Build Desktop & Mobile Table of Contents Sidebar
    toc_nodes_html = []
    mob_toc_nodes_html = []
    
    toc_nodes_html.append(f'''      <div class="toc-tree-node root-node" id="toc-node-root">
        <div class="toc-node-row">
          <span class="toc-caret" onclick="toggleTocBranch(this)">▾</span>
          <a class="toc-tree-link root-link" href="#sec-title" title="{html.escape(title)}">
            {html.escape(title)}
          </a>
        </div>
        <div class="toc-branch">''')
        
    mob_toc_nodes_html.append(f'''    <div class="toc-tree-node root-node" id="mob-toc-node-root">
      <div class="toc-node-row">
        <span class="toc-caret" onclick="toggleTocBranch(this)">▾</span>
        <a class="toc-tree-link root-link" href="#sec-title" onclick="toggleMobileToc()">
          {html.escape(title)}
        </a>
      </div>
      <div class="toc-branch">''')

    for node in toc_tree:
        if node["children"]:
            nid = f"toc-node-{node['id']}"
            mob_nid = f"mob-{nid}"
            toc_nodes_html.append(f'''          <div class="toc-tree-node" id="{nid}">
            <div class="toc-node-row">
              <span class="toc-caret" onclick="toggleTocBranch(this)">▾</span>
              <a class="toc-tree-link" href="#{node['id']}">{format_toc_title(node['title'])}</a>
            </div>
            <div class="toc-branch">''')
            mob_toc_nodes_html.append(f'''        <div class="toc-tree-node" id="{mob_nid}">
          <div class="toc-node-row">
            <span class="toc-caret" onclick="toggleTocBranch(this)">▾</span>
            <a class="toc-tree-link" href="#{node['id']}" onclick="toggleMobileToc()">{format_toc_title(node['title'])}</a>
          </div>
          <div class="toc-branch">''')
            for child in node["children"]:
                toc_nodes_html.append(f'''              <div class="toc-node-row">
                <span class="toc-leaf-dot"></span>
                <a class="toc-tree-link" href="#{child['id']}">{format_toc_title(child['title'])}</a>
              </div>''')
                mob_toc_nodes_html.append(f'''            <div class="toc-node-row">
              <span class="toc-leaf-dot"></span>
              <a class="toc-tree-link" href="#{child['id']}" onclick="toggleMobileToc()">{format_toc_title(child['title'])}</a>
            </div>''')
            toc_nodes_html.append('            </div>\n          </div>')
            mob_toc_nodes_html.append('          </div>\n        </div>')
        else:
            toc_nodes_html.append(f'''          <div class="toc-node-row">
            <span class="toc-leaf-dot"></span>
            <a class="toc-tree-link" href="#{node['id']}">{format_toc_title(node['title'])}</a>
          </div>''')
            mob_toc_nodes_html.append(f'''        <div class="toc-node-row">
          <span class="toc-leaf-dot"></span>
          <a class="toc-tree-link" href="#{node['id']}" onclick="toggleMobileToc()">{format_toc_title(node['title'])}</a>
        </div>''')

    # Append Architecture Lab to TOC
    lab_toc = '''          <!-- Architecture Lab Branches -->
          <div class="toc-tree-node" id="toc-node-lab" style="margin-top: 0.45rem;">
            <div class="toc-node-row">
              <span class="toc-caret" onclick="toggleTocBranch(this)">▾</span>
              <a class="toc-tree-link" href="#sub-solid" style="font-weight: 700; color: var(--accent-warning);">
                🏛️ Architecture Lab & Audit
              </a>
            </div>
            <div class="toc-branch">
              <div class="toc-node-row">
                <span class="toc-leaf-dot"></span>
                <a class="toc-tree-link" href="#sub-solid">1. Audit SOLID & Clean Arch</a>
              </div>
              <div class="toc-node-row">
                <span class="toc-leaf-dot"></span>
                <a class="toc-tree-link" href="#sub-blueprint">2. Refactoring Blueprint</a>
              </div>
              <div class="toc-node-row">
                <span class="toc-leaf-dot"></span>
                <a class="toc-tree-link" href="#sub-quiz">3. Interactive Retention Quiz</a>
              </div>
            </div>
          </div>'''
          
    mob_lab_toc = '''        <div class="toc-tree-node" id="mob-toc-node-lab" style="margin-top: 0.45rem;">
          <div class="toc-node-row">
            <span class="toc-caret" onclick="toggleTocBranch(this)">▾</span>
            <a class="toc-tree-link" href="#sub-solid" onclick="toggleMobileToc()" style="font-weight: 700; color: var(--accent-warning);">
              🏛️ Architecture Lab & Audit
            </a>
          </div>
          <div class="toc-branch">
            <div class="toc-node-row">
              <span class="toc-leaf-dot"></span>
              <a class="toc-tree-link" href="#sub-solid" onclick="toggleMobileToc()">1. Audit SOLID & Clean Arch</a>
            </div>
            <div class="toc-node-row">
              <span class="toc-leaf-dot"></span>
              <a class="toc-tree-link" href="#sub-blueprint" onclick="toggleMobileToc()">2. Refactoring Blueprint</a>
            </div>
            <div class="toc-node-row">
              <span class="toc-leaf-dot"></span>
              <a class="toc-tree-link" href="#sub-quiz" onclick="toggleMobileToc()">3. Interactive Retention Quiz</a>
            </div>
          </div>
        </div>'''
        
    toc_nodes_html.append(lab_toc)
    toc_nodes_html.append('        </div>\n      </div>')
    mob_toc_nodes_html.append(mob_lab_toc)
    mob_toc_nodes_html.append('      </div>\n    </div>')

    # 6. Build Slide-over Curriculum Drawer (All levels)
    drawer_levels_html = []
    to_root = "../" * target_depth if target_depth > 0 else ""
    
    for level in catalog:
        drawer_levels_html.append(f'''    <div class="curriculum-level-group">
      <div class="curriculum-level-title">{html.escape(level["level_title"])}</div>''')
        for itm in level["items"]:
            is_cur = (itm["rel_path"] == lesson_item["rel_path"])
            act_cls = " active" if is_cur else ""
            icon = "🟢" if is_cur else "📄"
            lbl_suffix = " (Sedang Dibaca)" if is_cur else ""
            item_href = "#" if is_cur else f"{to_root}{itm['target_rel_path']}"
            drawer_levels_html.append(f'''      <a class="curriculum-item-link{act_cls}" href="{item_href}">
        <span>{icon}</span> {html.escape(itm["title"])}{lbl_suffix}
      </a>''')
        drawer_levels_html.append('    </div>')

    # 7. Build Previous / Next Lesson Footer Navigation
    curr_idx = -1
    for i, itm in enumerate(flat_lessons):
        if itm["rel_path"] == lesson_item["rel_path"]:
            curr_idx = i
            break
            
    prev_btn_html = ""
    next_btn_html = ""
    if curr_idx > 0:
        prev_item = flat_lessons[curr_idx - 1]
        prev_href = f"{to_root}{prev_item['target_rel_path']}"
        prev_btn_html = f'''<a class="lesson-nav-btn prev" href="{prev_href}">
  ◀ Modul Sebelumnya: {html.escape(prev_item["title"])}
</a>'''
    if curr_idx < len(flat_lessons) - 1:
        next_item = flat_lessons[curr_idx + 1]
        next_href = f"{to_root}{next_item['target_rel_path']}"
        next_btn_html = f'''<a class="lesson-nav-btn next" href="{next_href}">
  Modul Selanjutnya: {html.escape(next_item["title"])} ▶
</a>'''

    # Section ID list for scrollspy
    section_ids_js = ["'sec-title'"]
    for node in toc_tree:
        section_ids_js.append(f"'{node['id']}'")
        for c in node["children"]:
            section_ids_js.append(f"'{c['id']}'")
    section_ids_js.extend(["'sub-solid'", "'sub-blueprint'", "'sub-quiz'"])
    section_ids_js_str = ", ".join(section_ids_js)

    # 8. Assemble Full HTML Document
    full_html = f'''<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title)} | Chiron Academy</title>
  
  <!-- Chiron Base Stylesheet -->
  <link rel="stylesheet" href="{rel_to_assets}/style.css">
  
  <!-- Prism.js Syntax Highlighting Theme (Tomorrow Night) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
  
  <!-- Mermaid.js for Dynamic Flow Diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({{ startOnLoad: true, theme: 'dark' }});</script>
</head>
<body>

<!-- ========================================================================= -->
<!-- STICKY TOP APPLICATION BAR (CROSSNOTE / VS CODE STYLE)                     -->
<!-- ========================================================================= -->
<nav class="app-topbar">
  <div class="topbar-nav-row">
    <!-- Browser-like History Navigation -->
    <div class="nav-history-ctrls">
      <button class="nav-ctrl-btn" onclick="history.back()" title="Kembali (Back)">◀</button>
      <button class="nav-ctrl-btn" onclick="history.forward()" title="Maju (Forward)">▶</button>
      <button class="nav-ctrl-btn" onclick="location.reload()" title="Segarkan (Reload)">↻</button>
    </div>

    <!-- Document Tabs Strip (Crossnote Style) -->
    <div class="topbar-tabs-scroll" id="docTabsStrip">
{chr(10).join(doc_tabs_html)}
    </div>

    <!-- Right Utilities -->
    <div class="topbar-tools">
      <button class="tool-btn" onclick="toggleCurriculumDrawer()" title="Buka seluruh daftar modul kurikulum">
        📚 Semua Modul
      </button>
      <button class="tool-btn active" id="topbarTocBtn" onclick="handleTocToggleClick()" title="Buka/Tutup Daftar Isi (Mode Fokus Membaca)">
        📑 Daftar Isi
      </button>
    </div>
  </div>
</nav>

<!-- Floating Button to Restore TOC When Dismissed (Focus Mode) -->
<button class="toc-expand-float-btn" id="tocExpandFloatBtn" onclick="toggleDesktopToc()" title="Tampilkan Kembali Daftar Isi">
  📑 Buka Daftar Isi
</button>

<!-- ========================================================================= -->
<!-- TWO-COLUMN DOCUMENTATION LAYOUT (MAIN CONTENT + STICKY TOC)               -->
<!-- ========================================================================= -->
<div class="docs-layout" id="docsLayout">

  <!-- Main Content Column -->
  <main class="docs-content">

    <!-- Header Section -->
    <header id="sec-title">
      <div class="badge">{track["badge"]}</div>
      <h1>{html.escape(title)}</h1>
      <p style="color: var(--text-muted); font-size: 1.05rem; margin-top: 0.25rem;">
        {html.escape(subtitle)}
      </p>
      <div class="metadata" style="margin-top: 1rem;">
        <span>📚 Modul: <strong>{Path(lesson_item["rel_path"]).stem}</strong></span>
        <span>🎯 Scope: <strong>{track["scope"]}</strong></span>
        <span>⏱️ Estimasi: <strong>20 Menit</strong></span>
        <span>🏷️ Git Branch: <strong>{track["branch"]}</strong></span>
      </div>
    </header>

    <!-- BAGIAN 1: DOKUMEN PEMBELAJARAN LENGKAP -->
    <div class="section-banner">
      <h2>📖 Bagian 1: Dokumen Pembelajaran Lengkap & Alur Nyata</h2>
      <span class="pill">Core Knowledge</span>
    </div>

{body_html}

    <!-- BAGIAN 2 & 3: ARCHITECTURAL CRITIQUE & BLUEPRINT -->
    <div class="section-banner lab" style="margin-top: 4rem;">
      <h2>🏛️ Bagian 2: Architecture Lab, SOLID Audit & Retention Quizzes</h2>
      <span class="pill" style="background-color: var(--accent-warning);">Architecture Lab</span>
    </div>

{critique_blueprint_html}

{quiz_html}

    <!-- Lesson Navigation Footer -->
    <div class="lesson-nav-footer">
      {prev_btn_html}
      {next_btn_html}
    </div>

    <!-- Footer -->
    <footer>
      <div>Chiron Codebase Mastery Academy • {track["name"]}</div>
      <div>Anchor Branch: <strong>{track["branch"]}</strong></div>
    </footer>

  </main>

  <!-- ========================================================================= -->
  <!-- RIGHT-HAND SIDEBAR: ON-PAGE TABLE OF CONTENTS                             -->
  <!-- ========================================================================= -->
  <aside class="docs-toc-sidebar" id="desktopTocSidebar">
    <div class="toc-header-bar">
      <span class="toc-header-label">📑 DAFTAR ISI</span>
      <div class="toc-header-actions">
        <button class="toc-action-btn" id="tocScrollTopBtn" title="Scroll ke Paling Atas" onclick="window.scrollTo({{top: 0, behavior: 'smooth'}})">▲</button>
        <button class="toc-action-btn" id="tocToggleAllBtn" title="Buka/Tutup Semua Cabang" onclick="toggleAllTocBranches()">🔄</button>
        <button class="toc-action-btn" id="tocResetActiveBtn" title="Fokuskan ke Topik Aktif" onclick="focusCurrentTocActive()">📑</button>
        <button class="toc-action-btn toc-dismiss-btn" id="tocDismissBtn" title="Tutup Daftar Isi (Fokus Mode Membaca)" onclick="toggleDesktopToc()">✕</button>
      </div>
    </div>

    <div class="toc-tree-container">
{chr(10).join(toc_nodes_html)}
    </div>
  </aside>

</div>

<!-- ========================================================================= -->
<!-- MOBILE / DRAWER TABLE OF CONTENTS OVERLAY                                 -->
<!-- ========================================================================= -->
<div class="mobile-toc-overlay" id="mobileTocOverlay" onclick="toggleMobileToc()"></div>
<div class="mobile-toc-drawer" id="mobileTocDrawer">
  <div class="toc-header-bar">
    <span class="toc-header-label">📑 DAFTAR ISI HALAMAN</span>
    <button class="drawer-close-btn" onclick="toggleMobileToc()">✕</button>
  </div>
  <div class="toc-tree-container" style="margin-top: 0.75rem;">
{chr(10).join(mob_toc_nodes_html)}
  </div>
</div>

<!-- ========================================================================= -->
<!-- FULL CURRICULUM DRAWER (CATALOG OF ALL MODULES)                           -->
<!-- ========================================================================= -->
<div class="curriculum-drawer-overlay" id="curriculumOverlay" onclick="toggleCurriculumDrawer()"></div>
<div class="curriculum-drawer" id="curriculumDrawer">
  <div class="drawer-header">
    <div class="drawer-title">📚 Kurikulum Lengkap {track["name"]}</div>
    <button class="drawer-close-btn" onclick="toggleCurriculumDrawer()">✕</button>
  </div>
  <div class="drawer-search">
    <input type="text" id="moduleSearchInput" placeholder="🔍 Cari modul (contoh: startup, router, auth)..." oninput="filterCurriculum()">
  </div>
  <div class="drawer-body" id="curriculumListBody">
{chr(10).join(drawer_levels_html)}
  </div>
</div>

<!-- ========================================================================= -->
<!-- FULLSCREEN MERMAID DIAGRAM LIGHTBOX MODAL                                 -->
<!-- ========================================================================= -->
<div id="diagramModal" class="diagram-modal" onclick="closeDiagramModal(event)">
  <div class="diagram-modal-dialog" onclick="event.stopPropagation()">
    <div class="diagram-modal-header">
      <h3 id="modalDiagramTitle">🔍 Pembesaran Diagram Alur</h3>
      <div class="diagram-modal-controls">
        <button class="diagram-ctrl-btn" onclick="zoomDiagram(1.25)">➕ Zoom In</button>
        <button class="diagram-ctrl-btn" onclick="zoomDiagram(0.8)">➖ Zoom Out</button>
        <button class="diagram-ctrl-btn" onclick="resetDiagramZoom()">↺ 100%</button>
        <button class="diagram-close-btn" onclick="closeDiagramModal()">✕ Tutup [Esc]</button>
      </div>
    </div>
    <div class="diagram-modal-body" id="diagramModalBody">
      <!-- Cloned SVG inserted dynamically -->
    </div>
  </div>
</div>

<!-- Prism.js Scripts for Syntax Highlighting -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-swift.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-dart.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-yaml.min.js"></script>

<!-- Interactive Scripts: Tabs, TOC ScrollSpy, Drawers & Quiz -->
<script>
  function toggleCurriculumDrawer() {{
    const drawer = document.getElementById('curriculumDrawer');
    const overlay = document.getElementById('curriculumOverlay');
    drawer.classList.toggle('open');
    overlay.classList.toggle('open');
  }}

  function toggleMobileToc() {{
    const drawer = document.getElementById('mobileTocDrawer');
    const overlay = document.getElementById('mobileTocOverlay');
    drawer.classList.toggle('open');
    overlay.classList.toggle('open');
  }}

  function filterCurriculum() {{
    const query = document.getElementById('moduleSearchInput').value.toLowerCase();
    const links = document.querySelectorAll('.curriculum-item-link');
    links.forEach(link => {{
      const text = link.innerText.toLowerCase();
      link.style.display = text.includes(query) ? 'flex' : 'none';
    }});
  }}

  function handleTocToggleClick() {{
    if (window.innerWidth > 1200) {{
      toggleDesktopToc();
    }} else {{
      toggleMobileToc();
    }}
  }}

  function toggleDesktopToc() {{
    document.body.classList.toggle('toc-collapsed');
    const isCollapsed = document.body.classList.contains('toc-collapsed');
    try {{
      localStorage.setItem('chiron_toc_collapsed', isCollapsed ? '1' : '0');
    }} catch (e) {{}}

    const topbarBtn = document.getElementById('topbarTocBtn');
    if (topbarBtn) {{
      if (isCollapsed) {{
        topbarBtn.classList.remove('active');
        topbarBtn.title = "Tampilkan Daftar Isi (Mode Normal)";
      }} else {{
        topbarBtn.classList.add('active');
        topbarBtn.title = "Tutup Daftar Isi (Mode Fokus Membaca)";
      }}
    }}
  }}

  function toggleTocBranch(caretEl) {{
    const node = caretEl.closest('.toc-tree-node');
    if (node) {{
      node.classList.toggle('collapsed');
      caretEl.textContent = node.classList.contains('collapsed') ? '▸' : '▾';
    }}
  }}

  function toggleAllTocBranches() {{
    const allNodes = document.querySelectorAll('.toc-tree-node');
    let hasCollapsed = false;
    allNodes.forEach(n => {{
      if (n.classList.contains('collapsed')) hasCollapsed = true;
    }});
    allNodes.forEach(n => {{
      const caret = n.querySelector(':scope > .toc-node-row > .toc-caret');
      if (hasCollapsed) {{
        n.classList.remove('collapsed');
        if (caret) caret.textContent = '▾';
      }} else {{
        if (!n.classList.contains('root-node')) {{
          n.classList.add('collapsed');
          if (caret) caret.textContent = '▸';
        }}
      }}
    }});
  }}

  function focusCurrentTocActive() {{
    const activeLink = document.querySelector('.toc-tree-link.active');
    if (activeLink) {{
      activeLink.scrollIntoView({{ block: 'nearest', behavior: 'smooth' }});
    }} else {{
      window.scrollTo({{ top: 0, behavior: 'smooth' }});
    }}
  }}

  window.addEventListener('DOMContentLoaded', () => {{
    try {{
      if (localStorage.getItem('chiron_toc_collapsed') === '1' && window.innerWidth > 1200) {{
        document.body.classList.add('toc-collapsed');
        const topbarBtn = document.getElementById('topbarTocBtn');
        if (topbarBtn) topbarBtn.classList.remove('active');
      }}
    }} catch (e) {{}}

    const sectionIds = [{section_ids_js_str}];
    const tocLinks = document.querySelectorAll('.toc-tree-link');

    window.addEventListener('scroll', () => {{
      let currentSection = '';
      const scrollPos = window.scrollY + 140;

      sectionIds.forEach(id => {{
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {{
          currentSection = id;
        }}
      }});

      if (currentSection) {{
        tocLinks.forEach(link => {{
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + currentSection) {{
            link.classList.add('active');
          }}
        }});
      }}
    }});
  }});

  // Diagram Lightbox Controls
  let currentDiagramScale = 1.0;
  function openDiagramZoom(diagramId, title) {{
    const originalEl = document.getElementById(diagramId);
    if (!originalEl) return;
    const svgEl = originalEl.querySelector('svg');
    if (!svgEl) return;

    const modal = document.getElementById('diagramModal');
    const modalBody = document.getElementById('diagramModalBody');
    const modalTitle = document.getElementById('modalDiagramTitle');

    modalTitle.innerHTML = title ? '🔍 ' + title : '🔍 Pembesaran Diagram Alur';
    modalBody.innerHTML = svgEl.outerHTML;
    
    currentDiagramScale = 1.0;
    const clonedSvg = modalBody.querySelector('svg');
    if (clonedSvg) clonedSvg.style.transform = 'scale(' + currentDiagramScale + ')';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }}

  function closeDiagramModal(event) {{
    if (event && event.target && event.target.closest && event.target.closest('.diagram-modal-dialog') && !event.target.classList.contains('diagram-close-btn')) {{
      return;
    }}
    const modal = document.getElementById('diagramModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }}

  function zoomDiagram(factor) {{
    const modalBody = document.getElementById('diagramModalBody');
    const svg = modalBody.querySelector('svg');
    if (!svg) return;
    currentDiagramScale *= factor;
    svg.style.transform = 'scale(' + currentDiagramScale + ')';
  }}

  function resetDiagramZoom() {{
    const modalBody = document.getElementById('diagramModalBody');
    const svg = modalBody.querySelector('svg');
    if (!svg) return;
    currentDiagramScale = 1.0;
    svg.style.transform = 'scale(1)';
  }}

  document.addEventListener('keydown', function(e) {{
    if (e.key === 'Escape') {{
      closeDiagramModal();
      const cDrawer = document.getElementById('curriculumDrawer');
      if (cDrawer && cDrawer.classList.contains('open')) toggleCurriculumDrawer();
      const tDrawer = document.getElementById('mobileTocDrawer');
      if (tDrawer && tDrawer.classList.contains('open')) toggleMobileToc();
    }} else if (e.key === ']' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT') {{
      handleTocToggleClick();
    }}
  }});

  // Quiz Evaluation Logic
  const explanations = {json.dumps(explanations_dict, ensure_ascii=False, indent=2)};

  function submitQuiz(quizId, selectedOption, isCorrect) {{
    const card = document.getElementById('quiz-' + quizId);
    const buttons = card.querySelectorAll('.quiz-btn');
    const feedback = document.getElementById('feedback-' + quizId);

    buttons.forEach(btn => {{
      btn.disabled = true;
      btn.style.cursor = 'default';
    }});

    if (window.event && window.event.target) {{
      window.event.target.classList.add(isCorrect ? 'correct' : 'incorrect');
    }}

    feedback.className = 'quiz-feedback show ' + (isCorrect ? 'success' : 'danger');
    feedback.innerHTML = '<strong>' + (isCorrect ? '🎉 Jawaban Tepat!' : '❌ Jawaban Salah!') + '</strong> ' + 
      (isCorrect ? explanations[quizId].success : explanations[quizId].danger);
  }}
</script>

<!-- Chiron Annotations & Multi-IDE Launcher Engine -->
<script src="{rel_to_assets}/chiron-client.js"></script>
<script src="{rel_to_assets}/chiron-ide-launcher.js"></script>
<script src="{rel_to_assets}/chiron-annotations.js"></script>

</body>
</html>
'''

    # Ensure parent directory exists
    target_full_path.parent.mkdir(parents=True, exist_ok=True)
    with open(target_full_path, "w", encoding="utf-8") as f:
        f.write(full_html)
        
    return target_full_path


def generate_course_metadata(track_key):
    """Generates MISSION.md, GLOSSARY.md, RESOURCES.md, NOTES.md for the course."""
    track = TRACK_CONFIG[track_key]
    target_dir = track["target_dir"]
    target_dir.mkdir(parents=True, exist_ok=True)
    
    is_ios = (track_key == "ios")
    tech_name = "iOS Native" if is_ios else "Flutter Hybrid Add-to-App"
    
    # 1. MISSION.md
    mission_content = f'''# Mission: SAMIR Mobile {track["name"]} Mastery & Architectural Audit

## Why
Menguasai dan memahami arsitektur, siklus hidup, pola navigasi, aliran bisnis finansial (P2P Lending), integrasi jembatan Native-Flutter, dan audit kualitas kode (**SOLID, Clean Architecture, Testability**) pada aplikasi **SAMIR {tech_name}**.

## Success Looks Like
- Menguasai seluruh alur kompilasi, startup sequence, dan initial routing dari berkas entry point hingga layar tab utama.
- Memahami implementasi data flow, persistensi status akun, dan mitigasi anti-fraud finansial.
- Mampu memetakan code smells (SRP/DIP violations, main thread lag, circular dependency) pada codebase produksi dan merancang refactoring blueprint standar industri.
- Menyelesaikan seluruh kuis retensi interaktif (Memory Recall & Architectural Decision) di setiap modul dengan pemahaman mendalam.

## Constraints
- Menjaga integritas codebase produksi SAMIR tanpa mengubah berkas sumber secara destruktif.
- Seluruh modul belajar disimpan dan disajikan mandiri di dalam repositori Chiron Classroom.
'''
    with open(target_dir / "MISSION.md", "w", encoding="utf-8") as f:
        f.write(mission_content)

    # 2. GLOSSARY.md
    if is_ios:
        glossary_content = '''# SAMIR Mobile iOS Glossary

Kamus istilah kanonikal, nama class, method, protokol delegasi, dan konfigurasi persistensi pada SAMIR iOS.

## Komponen & Modul Codebase
- **IDSamirMainModule**: Modul utama UIKit yang bertindak sebagai receiver delegasi siklus hidup `UIApplicationDelegate`.
- **CZModuleManager**: Modul arsitektur berbasis komponen untuk registrasi sub-modul startup dan inter-module messaging.
- **FlutterEngineManager**: Singleton manajer untuk membangkitkan instance tunggal Dart VM di latar belakang (`prewarm()`).
- **IDMainTabBarController**: Root tab controller yang menyatukan tab native Swift (Home) dan tab host Flutter (Repay & Mine).
- **IDRouterManager**: Modul routing terpusat untuk dispatch URL scheme dan deep link.
- **APP_Start_Hide**: Key persistensi `UserDefaults` untuk menentukan apakah splash screen promosi wajib ditampilkan.
- **Samir_DeepLink_Str**: Key penyimpanan string URL sementara untuk menahan *cold-start deep link*.

## Standar & Arsitektur
- **Single Responsibility Principle (SRP)**: Prinsip pemisahan tanggung jawab agar class tidak menjadi god object.
- **Dependency Inversion Principle (DIP)**: Modul tingkat tinggi wajib bergantung pada abstraksi protokol, bukan implementasi konkret.
- **Composite Startup Task**: Pola pemecahan inisialisasi monolitik startup menjadi serangkaian task mandiri yang testable.
'''
    else:
        glossary_content = '''# SAMIR Mobile Flutter Glossary

Kamus istilah kanonikal, class presenter, method channel, model data, dan struktur add-to-app pada SAMIR Flutter.

## Komponen & Modul Codebase
- **flutter_app_project**: Nama paket add-to-app Flutter yang di-embed ke dalam aplikasi host native iOS & Android.
- **FlutterNativeChannel**: Bridge MethodChannel untuk pertukaran data dua arah (Auth token, Device Info, Router).
- **RepayHomePage**: Layar tagihan nasabah (`repay_home_page.dart`) yang memuat rincian pinjaman aktif dan kode VA.
- **MineHomePage**: Layar profil nasabah (`mine_home_page.dart`) yang memuat data akun, pengaturan, dan pusat bantuan.
- **DioHttpClient**: Singleton client jaringan dengan interceptor penandatanganan parameter MD5/RSA dan enkripsi payload.
- **Global / SessionState**: Pengelola status sesi otentikasi nasabah yang disinkronkan dari aplikasi host native.

## Standar & Arsitektur
- **Clean Architecture BLoC / Controller**: Pemisahan logika bisnis dari tree widget Flutter.
- **Platform Channel Decoupling**: Abstraksi pemanggilan native ke dalam interface terisolasi agar dapat di-mock saat widget test.
'''
    with open(target_dir / "GLOSSARY.md", "w", encoding="utf-8") as f:
        f.write(glossary_content)

    # 3. RESOURCES.md
    resources_content = f'''# SAMIR Mobile {track["name"]} Resources

## Codebase Sources & Branches
- **Anchor Branch**: `{track["branch"]}`
- **GitLab Repository**: `http://gitlab.samir.co.id/samir_it/samir-mobile`
- **Local Path**: `/Users/samir/Documents/Workspace/SAMIR/Mobile/Nexus/samir-mobile-nexus`

## Modul Dokumentasi Terkait
- [Learning Roadmap](00-learning-roadmap.html)
- [Project Foundation](01-project-foundation/01-application-overview.html)
- [Understanding App Startup](02-understanding-app-startup/01-ios-entry-point.html)
- [Understanding Architecture](03-understanding-architecture/01-architecture-overview.html)
- [Understanding Navigation](04-understanding-navigation/01-feature-inventory.html)
- [Learning Business Flows](05-learning-business-flows/01-user-journey-overview.html)
- [Data & Dependencies](06-understanding-data-and-dependencies/01-dependency-catalog.html)
- [Debugging & Maintenance](07-learning-to-debug-and-maintain/01-error-handling.html)
- [Reference & Audit](08-reference/01-codebase-glossary.html)
'''
    with open(target_dir / "RESOURCES.md", "w", encoding="utf-8") as f:
        f.write(resources_content)

    # 4. NOTES.md
    notes_content = f'''# Pedagogical Notes & Architecture Log: {track["name"]}

## Status
- Track berhasil dikompilasi secara otomatis ke dalam format Chiron Classroom (/teach).
- Seluruh 40 materi markdown asli dipertahankan dengan relasi 1-to-1 tanpa penggabungan file.
- Terintegrasi penuh dengan Chiron Multi-IDE Launcher (Antigravity IDE, Cursor, VS Code, Xcode).
'''
    with open(target_dir / "NOTES.md", "w", encoding="utf-8") as f:
        f.write(notes_content)


def compile_entire_track(track_key):
    """Executes full conversion pipeline for a given track (ios or flutter)."""
    track = TRACK_CONFIG[track_key]
    print(f"\n=======================================================")
    print(f"🚀 Memulai Kompilasi Kurikulum Chiron: {track['name']}")
    print(f"   Source: {track['source_dir']}")
    print(f"   Target: {track['target_dir']}")
    print(f"=======================================================")
    
    catalog, flat_lessons = build_curriculum_catalog(track["source_dir"], track["levels"])
    print(f"📦 Ditemukan {len(flat_lessons)} berkas materi (.md) terstruktur dalam {len(catalog)} level.")
    
    # 1. Compile each lesson
    compiled_paths = []
    for idx, lesson in enumerate(flat_lessons, 1):
        target_path = compile_lesson_to_html(lesson, catalog, flat_lessons, track_key)
        compiled_paths.append(target_path)
        print(f"  [{idx:02d}/{len(flat_lessons):02d}] ✅ Dikompilasi: {lesson['target_rel_path']}")
        
    # 2. Generate track metadata files
    generate_course_metadata(track_key)
    print(f"📝 Berkas metadata kursus dibuat: MISSION.md, GLOSSARY.md, RESOURCES.md, NOTES.md")
    
    return catalog, flat_lessons, compiled_paths


def main():
    print("🌟 CHIRON CURRICULUM COMPILER INITIALIZED 🌟")
    
    # Compile iOS Track
    ios_cat, ios_lessons, ios_paths = compile_entire_track("ios")
    
    # Compile Flutter Track
    flutter_cat, flutter_lessons, flutter_paths = compile_entire_track("flutter")
    
    print("\n=======================================================")
    print("🎉 SELURUH MATERI iOS & FLUTTER BERHASIL DIKONVERSI!")
    print(f"   Total iOS Lessons: {len(ios_paths)}")
    print(f"   Total Flutter Lessons: {len(flutter_paths)}")
    print(f"   Grand Total: {len(ios_paths) + len(flutter_paths)} Materi HTML Mandiri")
    print("=======================================================")


if __name__ == "__main__":
    main()
