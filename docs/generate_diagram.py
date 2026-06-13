import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe

fig, ax = plt.subplots(figsize=(20, 14))
ax.set_xlim(0, 20)
ax.set_ylim(0, 14)
ax.axis('off')
fig.patch.set_facecolor('#0F172A')
ax.set_facecolor('#0F172A')

# ── colour palette ──────────────────────────────────────────────────
C = {
    'user':     '#1E40AF',   # blue
    'frontend': '#065F46',   # green
    'backend':  '#7C3AED',   # purple
    'db':       '#B45309',   # amber
    'ai':       '#BE185D',   # pink
    'payment':  '#0E7490',   # cyan
    'border':   '#334155',
    'text':     '#F8FAFC',
    'subtext':  '#CBD5E1',
    'arrow':    '#94A3B8',
    'bg':       '#1E293B',
}

def box(ax, x, y, w, h, color, label, sublabel=''):
    patch = FancyBboxPatch(
        (x - w/2, y - h/2), w, h,
        boxstyle='round,pad=0.08',
        facecolor=color, edgecolor='white', linewidth=1.5, alpha=0.92,
        zorder=3
    )
    ax.add_patch(patch)
    ax.text(x, y + (0.18 if sublabel else 0), label,
            ha='center', va='center', fontsize=10, fontweight='bold',
            color=C['text'], zorder=4)
    if sublabel:
        ax.text(x, y - 0.32, sublabel,
                ha='center', va='center', fontsize=7.5,
                color=C['subtext'], zorder=4)

def group(ax, x, y, w, h, label, color):
    patch = FancyBboxPatch(
        (x, y), w, h,
        boxstyle='round,pad=0.12',
        facecolor=color, edgecolor=color, linewidth=2, alpha=0.18, zorder=1
    )
    ax.add_patch(patch)
    ax.text(x + 0.2, y + h - 0.3, label,
            ha='left', va='top', fontsize=8, fontweight='bold',
            color=color, alpha=0.9, zorder=2)

def arrow(ax, x1, y1, x2, y2, label='', color='#94A3B8', bidirectional=False):
    style = '<|-|>' if bidirectional else '-|>'
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(
                    arrowstyle=style,
                    color=color, lw=1.6,
                    connectionstyle='arc3,rad=0.05',
                    mutation_scale=14
                ), zorder=5)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mx, my + 0.18, label, ha='center', va='bottom',
                fontsize=7, color=C['subtext'],
                bbox=dict(fc='#0F172A', ec='none', pad=1), zorder=6)

# ── title ────────────────────────────────────────────────────────────
ax.text(10, 13.5, 'AI Freelancer Payment Agent — System Architecture',
        ha='center', va='center', fontsize=15, fontweight='bold',
        color=C['text'])
ax.text(10, 13.1, 'Next.js 15  ·  FastAPI  ·  PostgreSQL  ·  Claude AI  ·  Circle USDC',
        ha='center', va='center', fontsize=9, color=C['subtext'])

# ── GROUP: Users (left column) ───────────────────────────────────────
group(ax, 0.3, 8.5, 3.4, 4.2, 'USERS', C['user'])
box(ax, 2.0, 12.1, 2.6, 0.72, C['user'], 'Freelancer',   'Creates invoices / views finance')
box(ax, 2.0, 10.9, 2.6, 0.72, C['user'], 'Client',        'Receives & pays invoices')
box(ax, 2.0,  9.7, 2.6, 0.72, C['user'], 'Admin',         'Oversees platform activity')

# ── GROUP: Frontend (centre-left) ───────────────────────────────────
group(ax, 4.2, 8.5, 3.6, 4.2, 'FRONTEND', C['frontend'])
box(ax, 6.0, 12.1, 3.0, 0.72, C['frontend'], 'Next.js 15 App',    'Vercel Edge Network')
box(ax, 6.0, 10.9, 3.0, 0.72, C['frontend'], 'Dashboard UI',       'React / Tailwind CSS')
box(ax, 6.0,  9.7, 3.0, 0.72, C['frontend'], 'AI Chat Interface',  'Streaming responses')

# ── GROUP: Backend (centre) ─────────────────────────────────────────
group(ax, 8.2, 8.5, 3.6, 4.2, 'BACKEND', C['backend'])
box(ax, 10.0, 12.1, 3.0, 0.72, C['backend'], 'FastAPI Server',    'REST + WebSocket')
box(ax, 10.0, 10.9, 3.0, 0.72, C['backend'], 'Auth & JWT',        'Role-based access')
box(ax, 10.0,  9.7, 3.0, 0.72, C['backend'], 'Invoice Engine',    'CRUD + status machine')

# ── GROUP: Database ──────────────────────────────────────────────────
group(ax, 8.2, 5.8, 3.6, 2.3, 'DATA LAYER', C['db'])
box(ax, 10.0, 7.2, 3.0, 0.72, C['db'], 'PostgreSQL',      'Users / Invoices / Payments')
box(ax, 10.0, 6.2, 3.0, 0.72, C['db'], 'Prisma ORM',      'Schema migrations')

# ── GROUP: AI Agents ─────────────────────────────────────────────────
group(ax, 4.2, 3.0, 7.6, 4.8, 'CLAUDE AI AGENTS', C['ai'])
box(ax,  6.2, 6.5, 2.8, 0.72, C['ai'], 'Invoice Agent',    'Auto-generates invoices')
box(ax,  9.5, 6.5, 2.8, 0.72, C['ai'], 'Reminder Agent',   'Sends payment reminders')
box(ax, 12.8, 6.5, 2.8, 0.72, C['ai'], 'Finance Agent',    'Insights & analytics')
box(ax,  9.5, 4.8, 3.2, 0.72, C['ai'], 'Claude claude-sonnet-4-6',       'Anthropic API (claude-sonnet-4-6)')
box(ax,  6.2, 3.7, 2.8, 0.72, C['ai'], 'Tool Calls',       'Structured outputs')
box(ax, 12.8, 3.7, 2.8, 0.72, C['ai'], 'Streaming',        'Real-time chat responses')

# ── GROUP: Payment Layer ─────────────────────────────────────────────
group(ax, 16.0, 5.8, 3.7, 6.6, 'PAYMENT LAYER', C['payment'])
box(ax, 17.85, 11.8, 3.0, 0.72, C['payment'], 'Circle API',        'USDC stablecoin')
box(ax, 17.85, 10.5, 3.0, 0.72, C['payment'], 'Wallet Engine',     'Simulation mode')
box(ax, 17.85,  9.2, 3.0, 0.72, C['payment'], 'Arc Testnet',       'On-chain settlement')
box(ax, 17.85,  7.8, 3.0, 0.72, C['payment'], 'USDC Transfers',    'Programmable payments')
box(ax, 17.85,  6.6, 3.0, 0.72, C['payment'], 'Webhooks',          'Payment status events')

# ── ARROWS: Users → Frontend ─────────────────────────────────────────
arrow(ax, 3.3, 12.1, 4.5, 12.1, 'HTTPS / Auth', bidirectional=True)
arrow(ax, 3.3, 10.9, 4.5, 10.9, 'HTTPS', bidirectional=True)
arrow(ax, 3.3,  9.7, 4.5,  9.7, 'HTTPS', bidirectional=True)

# ── ARROWS: Frontend → Backend ───────────────────────────────────────
arrow(ax, 7.5, 12.1, 8.5, 12.1, 'REST API', bidirectional=True)
arrow(ax, 7.5, 10.9, 8.5, 10.9, 'REST API', bidirectional=True)
arrow(ax, 7.5,  9.7, 8.5,  9.7, 'WebSocket', bidirectional=True)

# ── ARROWS: Backend → DB ─────────────────────────────────────────────
arrow(ax, 10.0, 9.33, 10.0, 7.57, 'SQL / Prisma', bidirectional=True)

# ── ARROWS: Backend → AI Agents ──────────────────────────────────────
arrow(ax, 8.5, 11.2,  6.2, 6.87, 'trigger', color='#F472B6')
arrow(ax, 10.0, 9.33, 9.5, 6.87, 'trigger', color='#F472B6')
arrow(ax, 11.5, 11.2, 12.8, 6.87, 'trigger', color='#F472B6')

# ── ARROWS: Agents → Claude (hub) ────────────────────────────────────
arrow(ax,  6.2, 6.13,  8.9, 5.13, '', color='#EC4899')
arrow(ax,  9.5, 6.13,  9.5, 5.13, '', color='#EC4899')
arrow(ax, 12.8, 6.13, 10.1, 5.13, '', color='#EC4899')

# ── ARROWS: Claude → Tool / Streaming ────────────────────────────────
arrow(ax, 8.5, 4.8,  6.5, 4.07, '', color='#EC4899')
arrow(ax, 10.5, 4.8, 12.5, 4.07, '', color='#EC4899')

# ── ARROWS: Backend → Payment Layer ──────────────────────────────────
arrow(ax, 11.5, 10.9, 16.3, 10.9, 'USDC pay', bidirectional=True, color='#22D3EE')
arrow(ax, 11.5,  9.7, 16.3,  9.2, 'webhook', color='#22D3EE')

# ── ARROWS: Payment Webhooks → Backend ───────────────────────────────
arrow(ax, 16.35, 6.6, 11.5, 9.5, 'status event', color='#22D3EE')

# ── LEGEND ───────────────────────────────────────────────────────────
legend_items = [
    (C['user'],    'User Layer'),
    (C['frontend'],'Frontend (Vercel)'),
    (C['backend'], 'Backend (FastAPI)'),
    (C['db'],      'Data Layer'),
    (C['ai'],      'AI Agents (Claude)'),
    (C['payment'], 'Payment (Circle USDC)'),
]
lx, ly = 0.4, 5.0
for i, (c, lbl) in enumerate(legend_items):
    patch = mpatches.Patch(facecolor=c, edgecolor='white', linewidth=0.8)
    ax.add_patch(mpatches.FancyBboxPatch(
        (lx, ly - i * 0.55), 0.35, 0.32,
        boxstyle='round,pad=0.04', facecolor=c,
        edgecolor='white', linewidth=0.8, zorder=7
    ))
    ax.text(lx + 0.52, ly - i * 0.55 + 0.16, lbl,
            va='center', fontsize=8, color=C['subtext'], zorder=8)

ax.text(lx, ly + 0.55, 'LEGEND', fontsize=8, fontweight='bold',
        color=C['text'], zorder=8)

plt.tight_layout(pad=0.5)
plt.savefig(
    r'C:\Users\pc\Desktop\freelacing payment\docs\architecture-diagram.png',
    dpi=180, bbox_inches='tight',
    facecolor=fig.get_facecolor()
)
print('Saved: docs/architecture-diagram.png')
