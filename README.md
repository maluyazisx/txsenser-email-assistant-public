# TxSenser Email — synthetic source-mail preview

This small public snapshot demonstrates the existing G1/G2 source-mail reader:
read the supplied Chinese text, reveal its matching English original, and switch
between supplied historical messages. The two example emails are fictional.

Open `preview/index.html` directly in a browser. No account, server, mailbox,
API key, installation, or external connection is required.

## Scope

The reader JavaScript, CSS, and example fixture reuse the existing Email
project component. This export adds
only a standalone preview wrapper and focused checks. It is a component preview,
not the complete Email Assistant, a release, or evidence of real-mail acceptance.
The translations are supplied fictional examples; the demo does not translate.

The original project history, issues, governance, acceptance records, mailbox
connector, Brain, customer data, credentials, and native application are excluded.
The directory has no inherited Git history. No license grant has been added.

## Local checks

Requires Python 3.13 and Node.js 20 or later. These checks are offline.

```sh
python3 tools/build_preview.py
node tests/g1g2.cjs
python3 tests/check_preview.py
```

The GitHub workflow additionally uses a pinned Playwright driver with the hosted
Ubuntu image's Chrome to check the same preview at desktop and narrow widths.
It uploads only the generated preview and two synthetic screenshots. It does
not deploy a website, use a self-hosted runner, access secrets, or open real mail.

For browser checks, install `playwright@1.55.1` outside this checkout, set
`NODE_PATH` to that installation's `node_modules`, then run
`node tests/browser.cjs`. Set `CHROME_PATH` if Chrome is elsewhere.

## CEO experience

1. Read the full Chinese example, including the final paragraph.
2. Reveal the English original; expand history and switch to the other message.
3. Choose the example with no supplied source and confirm it does not reuse text.

Product feedback on this preview is separate from release approval. Real mailbox
access, sending, native macOS integration, and lasting business records remain
outside this snapshot and need their own bounded validation when changed.

## Second clickable experience: one fictional business matter

Open [the business-matter preview](preview/business.html) after the existing source reader. It reuses the published G1/G2 reader unchanged, adds a wholly fictional inquiry and one supplied historical message, and lets the CEO compare evidence with unanswered facts, select one of two **prewritten** reply strategies, edit the English draft, and observe when the previously supplied Chinese mirror becomes stale. Copying only prepares draft text: **no send, approval, real translation, AI discussion, permanent memory, or Sent reconciliation occurs**. Do not enter real business data into this public preview.

The incremental hosted checks are `python -B tests/check_business.py` and `node tests/business-browser.cjs` (Ubuntu Chrome at desktop and narrow widths); old G1/G2 evidence remains separate. The original private project, history, governance and release gates are unchanged. The product goal remains proactive attention, customer history, genuine collaboration, cross-day continuity and governed long-term knowledge, not this synthetic page.
