'use strict';

const T = {
  en: {
    page_title: 'WPC Hub — Documentation',
    nav_title: 'WPC Hub',
    nav_subtitle: 'Documentation',
    nav_overview: 'Overview',
    nav_setup: 'Initial Setup',
    nav_reporting: 'Reporting',
    nav_report: 'Report',
    nav_checklist: 'Checklist',
    nav_quicktext: 'QuickText',
    nav_screenshot: 'Screenshot',
    nav_snapslide: 'SnapSlide',
    nav_qa: 'QA & Validation',
    nav_countryscan: 'Content Scan',
    nav_cta: 'CTA Check',
    nav_links: 'Link Check',
    nav_overflow: 'Text Clipping',
    nav_viewfast: 'Mobile View',
    nav_shopapp: 'ShopApp',
    nav_shopapp_tools: 'ShopApp Tools',
    badge_reporting: 'Reporting',
    badge_qa: 'QA & Validation',
    badge_shopapp: 'ShopApp',
    overview_title: 'Overview',
    setup_title: 'Initial Setup',
    report_title: 'Report',
    checklist_title: 'Checklist',
    quicktext_title: 'QuickText',
    screenshot_title: 'Screenshot',
    snapslide_title: 'SnapSlide',
    countryscan_title: 'Content Scan',
    cta_title: 'CTA Check',
    links_title: 'Link Check',
    overflow_title: 'Text Clipping',
    viewfast_title: 'Mobile View',
    shopapp_title: 'ShopApp Tools',

    overview_content: `
      <p class="section-intro">WPC Hub is a unified browser extension for the WPC QA team. It brings all QA tools together in a single interface — reporting, checklist generation, screenshot capture, link validation, CTA auditing, and more.</p>
      <h3>Extension Groups</h3>
      <p>The extension is organized into three groups accessible from the top navigation bar:</p>
      <div class="group-card reporting-card">
        <div class="group-card-header"><span class="group-dot dot-blue"></span><strong>Reporting</strong></div>
        <p>Tools for generating and sending QA reports, checklists, screenshots, and annotated slides. Includes <strong>Report</strong>, <strong>Checklist</strong>, <strong>QuickText</strong>, <strong>Screenshot</strong>, and <strong>SnapSlide</strong>.</p>
      </div>
      <div class="group-card qa-card">
        <div class="group-card-header"><span class="group-dot dot-green"></span><strong>QA &amp; Validation</strong></div>
        <p>Automated page auditing tools. Includes <strong>Content Scan</strong>, <strong>CTA Check</strong>, <strong>Link Check</strong>, <strong>Text Clipping</strong>, and <strong>Mobile View</strong>.</p>
      </div>
      <div class="group-card shopapp-card">
        <div class="group-card-header"><span class="group-dot dot-amber"></span><strong>ShopApp</strong></div>
        <p>Visual helpers for the ShopApp CMS (opstools). Only works on opstools pages.</p>
      </div>
      <h3>Compatibility</h3>
      <p>WPC Hub is compatible with <strong>Chrome</strong>, <strong>Edge</strong>, and <strong>Firefox</strong> via the WebExtensions API.</p>`,

    setup_content: `
      <p class="section-intro">Before using WPC Hub, configure your account information and API endpoints in Settings. Access Settings via the gear icon (⚙) in the header — visible only when the Reporting group is active.</p>
      <h3>Opening Settings</h3>
      <ol>
        <li>Click the <strong>Reporting</strong> tab in the main navigation bar</li>
        <li>Click the <strong>gear icon (⚙)</strong> in the top-right of the header</li>
        <li>The Settings panel slides in from the right</li>
        <li>Fill in your details and click <strong>Save Settings</strong></li>
      </ol>
      <h3>Account</h3>
      <div class="field-doc"><div class="field-doc-name">QA Username</div><div class="field-doc-desc">Your team username. Auto-fills the username field in <strong>Report</strong> and <strong>QuickText</strong>. Used to replace the <code>{user_name}</code> placeholder in QuickText templates.</div></div>
      <div class="field-doc"><div class="field-doc-name">QA ID</div><div class="field-doc-desc">Your QA identifier. Used in the checklist filename: <code>QA_ID_YYMMDD_template.xlsx</code>.</div></div>
      <h3>Report Module</h3>
      <div class="field-doc"><div class="field-doc-name">Apps Script URL</div><div class="field-doc-desc">The Google Apps Script URL that receives reports and writes them to Google Sheets. Ask your team lead if you don't have this URL.</div></div>
      <h3>SnapSlide Module</h3>
      <div class="field-doc"><div class="field-doc-name">Apps Script URL</div><div class="field-doc-desc">The Google Apps Script URL that inserts screenshots into Google Slides.</div></div>
      <div class="field-doc"><div class="field-doc-name">Default Presentation ID</div><div class="field-doc-desc">The ID of the target Google Slides presentation. Found in the Slides URL: <code>docs.google.com/presentation/d/<strong>[ID]</strong>/edit</code>.</div></div>
      <h3>QuickText Templates</h3>
      <p>Select a template from the dropdown, edit the content in the textarea, and save. Use <code>{user_name}</code> anywhere — it will be replaced with your QA Username when copied. Click <strong>Reset to default</strong> to restore original text.</p>`,

    report_content: `
      <p class="section-intro">The Report module sends a structured QA report to Google Sheets via a Google Apps Script endpoint. Each report captures the test result, page category, country/region, and optional notes.</p>
      <h3>Prerequisites</h3>
      <p>Configure the <strong>Apps Script URL</strong> and <strong>QA Username</strong> in Settings before sending reports.</p>
      <h3>How to Use</h3>
      <ol>
        <li>Select the <strong>Category</strong> — the type of page being tested (e.g., ShopApp, PDP, HOME)</li>
        <li>Select the <strong>Sub</strong> — the country/region (e.g., BR, CO, LATIN)</li>
        <li>Select the <strong>Status</strong> — APPROVED, REJECTED, FIXED, or PENDING</li>
        <li>Optionally enter <strong>Publisher Error</strong> and <strong>Pending Customer</strong> counts</li>
        <li>Optionally select a <strong>Reason for adjustment</strong></li>
        <li>Enter your <strong>QA Username</strong> (auto-filled if saved in Settings)</li>
        <li>Add optional <strong>Comments</strong> — use the <strong>Translate</strong> button to auto-translate PT→EN</li>
        <li>Click <strong>Send Report</strong> — the popup closes automatically on success</li>
      </ol>
      <div class="tip-box"><strong>Tip:</strong> Click the <strong>Sheets</strong> button to open the Google Sheets log in a new tab.</div>
      <h3>Fields Reference</h3>
      <div class="field-doc"><div class="field-doc-name">Category</div><div class="field-doc-desc">ShopApp · Static Page · PCD · PDP · GNB/Footer · PF · Buy Page · HOME · PFS · MKT · Offer · EOL redirect · EPP · Business page · SEO</div></div>
      <div class="field-doc"><div class="field-doc-name">Sub</div><div class="field-doc-desc">BR · CO · LATIN · LATIN_EN · MX · CL · PE · AR · PY · UY · EURO</div></div>
      <div class="field-doc"><div class="field-doc-name">Status</div><div class="field-doc-desc"><strong>APPROVED</strong> — passed QA · <strong>REJECTED</strong> — failed QA · <strong>FIXED</strong> — previously rejected, now corrected · <strong>PENDING</strong> — awaiting further action</div></div>
      <div class="field-doc"><div class="field-doc-name">Reason</div><div class="field-doc-desc">HDR_ISSUE · SEO_PROBLEM · GAL_ISSUE · TRN_ISSUE · FEA_ISSUE · BLK_ISSUE · AST_ISSUE · REG_ISSUE · MISS_ISSUE · WDT_ISSUE · WDT_ASSET · WDT_LINK · RTB_ISSUE · CUST_ISSUE</div></div>`,

    checklist_content: `
      <p class="section-intro">The Checklist module generates a pre-filled Excel (.xlsx) QA checklist file named automatically with your QA ID and the current date.</p>
      <h3>How to Use</h3>
      <ol>
        <li>Enter your <strong>QA ID</strong> (auto-filled if saved in Settings) and click the save icon</li>
        <li>Check one or more <strong>templates</strong> matching the page types you're testing</li>
        <li>Click <strong>Create Checklist</strong> to generate the file</li>
        <li>Click <strong>Download</strong> to save the .xlsx file</li>
      </ol>
      <h3>Available Templates</h3>
      <div class="template-grid">
        <span class="template-tag">Standard</span><span class="template-tag">FOOTER</span>
        <span class="template-tag">GNB</span><span class="template-tag">HOME</span>
        <span class="template-tag">OFFER</span><span class="template-tag">PCD</span>
        <span class="template-tag">PDP</span><span class="template-tag">PF</span>
        <span class="template-tag">PFS Home</span><span class="template-tag">PFS Mobile</span>
        <span class="template-tag">Redirect</span>
      </div>
      <h3>File Naming</h3>
      <p>Files follow the pattern: <code>QA_ID_YYMMDD_TemplateName.xlsx</code></p>
      <p>Example: <code>JD01_260615_Standard.xlsx</code></p>
      <div class="tip-box"><strong>Tip:</strong> Select multiple templates at once — a separate file is generated for each selected template.</div>`,

    quicktext_content: `
      <p class="section-intro">QuickText provides one-click copying of pre-written QA comment templates. Click any button to copy its text to the clipboard — the popup closes automatically after copying.</p>
      <h3>How to Use</h3>
      <ol>
        <li>Enter your <strong>QA Username</strong> (auto-filled if saved in Settings)</li>
        <li>Browse the template buttons organized by category</li>
        <li>Click any template — the text copies to your clipboard instantly</li>
        <li>A checkmark (✓) appears to confirm the copy was successful</li>
        <li>Paste the text in your ticket or comment field</li>
      </ol>
      <h3>Template Categories</h3>
      <div class="category-row"><span class="cat-badge cat-approved">Approved</span><span>Templates for pages that passed QA review</span></div>
      <div class="category-row"><span class="cat-badge cat-rejected">Rejected</span><span>Templates for pages that failed QA review</span></div>
      <div class="category-row"><span class="cat-badge cat-shopapp">ShopApp</span><span>Templates for ShopApp CMS workflows</span></div>
      <h3>Username Placeholder</h3>
      <p>Templates can include the <code>{user_name}</code> placeholder, which is automatically replaced with your saved QA Username when you click a template. Customize any template text via <strong>Settings → QuickText Templates</strong>.</p>`,

    screenshot_content: `
      <p class="section-intro">The Screenshot module captures a screenshot of the active browser tab's visible viewport. The captured image can be downloaded as PNG or copied to the clipboard.</p>
      <h3>How to Use</h3>
      <ol>
        <li>Navigate to the page you want to capture</li>
        <li>Open WPC Hub → <strong>Reporting → Screenshot</strong></li>
        <li>Click <strong>Capture Full Page</strong></li>
        <li>A preview of the screenshot appears below the button</li>
        <li>Click <strong>Download PNG</strong> to save the file, or <strong>Copy Image</strong> to copy to clipboard</li>
      </ol>
      <div class="tip-box"><strong>Tip:</strong> Downloaded files are named automatically with a timestamp: <code>screenshot_YYYYMMDD_HHMMSS.png</code>.</div>
      <div class="warn-box"><strong>Note:</strong> The capture covers the currently visible viewport area. For annotated documentation with error descriptions, use the SnapSlide module instead.</div>`,

    snapslide_content: `
      <p class="section-intro">SnapSlide captures a screenshot from your clipboard and sends it — along with error metadata — directly to a Google Slides presentation via Google Apps Script.</p>
      <h3>Prerequisites</h3>
      <p>Configure the <strong>SnapSlide Apps Script URL</strong> and <strong>Default Presentation ID</strong> in Settings.</p>
      <h3>How to Use</h3>
      <ol>
        <li>Take a screenshot of the page issue using your OS screenshot tool</li>
        <li>Copy the screenshot to your clipboard (<strong>Ctrl+C</strong> or OS shortcut)</li>
        <li>Open WPC Hub → <strong>Reporting → SnapSlide</strong></li>
        <li>Confirm or enter the <strong>Presentation ID</strong></li>
        <li>Click in the canvas area and press <strong>Ctrl+V</strong> to paste the screenshot</li>
        <li>Fill in the <strong>Page Type</strong> (e.g., Home, PDP)</li>
        <li>Select an <strong>Error Category</strong> from the dropdown</li>
        <li>Optionally write an <strong>Error Description</strong> (Translate button available)</li>
        <li>Click <strong>Send to Slides</strong></li>
      </ol>
      <h3>Error Categories</h3>
      <div class="template-grid">
        <span class="template-tag">HDR_ISSUE</span><span class="template-tag">SEO_PROBLEM</span>
        <span class="template-tag">GAL_ISSUE</span><span class="template-tag">TRN_ISSUE</span>
        <span class="template-tag">FEA_ISSUE</span><span class="template-tag">BLK_ISSUE</span>
        <span class="template-tag">AST_ISSUE</span><span class="template-tag">REG_ISSUE</span>
        <span class="template-tag">MISS_ISSUE</span>
      </div>
      <div class="tip-box"><strong>Tip:</strong> Click the <strong>Slides</strong> button to open the target presentation in a new tab.</div>`,

    countryscan_content: `
      <p class="section-intro">Content Scan analyzes the active page to detect language, country, script composition, and QA-specific issues like wrong CTA country links or mismatched asset countries.</p>
      <h3>How to Use</h3>
      <ol>
        <li>Navigate to the page you want to scan</li>
        <li>Open WPC Hub → <strong>QA &amp; Validation → Content Scan</strong></li>
        <li>Optionally select a <strong>Language</strong> override (default: Auto-detect)</li>
        <li>Click <strong>Scan</strong></li>
        <li>Review results: page info, detected language, word/character count, script composition</li>
      </ol>
      <h3>Scan Results</h3>
      <div class="field-doc"><div class="field-doc-name">Title / URL / Country</div><div class="field-doc-desc">Basic page metadata extracted from the active tab.</div></div>
      <div class="field-doc"><div class="field-doc-name">Detected Language</div><div class="field-doc-desc">Language detected on the page with a confidence percentage bar.</div></div>
      <div class="field-doc"><div class="field-doc-name">Words / Characters</div><div class="field-doc-desc">Total visible text content counted on the page.</div></div>
      <div class="field-doc"><div class="field-doc-name">Script Composition</div><div class="field-doc-desc">Breakdown of writing systems detected (Latin, Cyrillic, CJK, Arabic, etc.) shown as percentage bars.</div></div>
      <h3>QA Tools (Accordion)</h3>
      <p>Click the <strong>QA Tools</strong> accordion to expand additional checks:</p>
      <div class="field-doc"><div class="field-doc-name">Asset Country Check</div><div class="field-doc-desc">Scans image URLs and flags assets whose URL country code doesn't match the page's expected country.</div></div>
      <div class="field-doc"><div class="field-doc-name">CTA Country Check</div><div class="field-doc-desc">Inspects CTA link URLs and flags links pointing to a different country subdomain than expected.</div></div>
      <h3>Supported Countries</h3>
      <div class="template-grid">
        <span class="template-tag">br</span><span class="template-tag">co</span><span class="template-tag">cl</span>
        <span class="template-tag">mx</span><span class="template-tag">pe</span><span class="template-tag">ar</span>
        <span class="template-tag">uy</span><span class="template-tag">py</span>
        <span class="template-tag">latin</span><span class="template-tag">latin_en</span>
      </div>`,

    cta_content: `
      <p class="section-intro">CTA Check is a unified page audit. One click on <strong>Scan Page</strong> runs three checks simultaneously: CTA violations, link target behavior, and an HTTP status check of every link on the page — all results organized in collapsible accordion panels.</p>
      <h3>How to Use</h3>
      <ol>
        <li>Navigate to the page you want to audit</li>
        <li>Open WPC Hub → <strong>QA &amp; Validation → CTA Check</strong></li>
        <li>Click <strong>Scan Page</strong></li>
        <li>A progress bar appears while the background HTTP check runs — you can close the popup and return later</li>
        <li>When all checks finish, three result panels appear — sections with violations open automatically</li>
        <li>Click any panel header to expand or collapse it</li>
        <li>Click <strong>Highlight All</strong> to mark CTA and link violations on the page with colored borders</li>
        <li>Click <strong>Copy Report</strong> to export all three sections to clipboard</li>
        <li>Click <strong>Clear results</strong> to reset and run a new scan</li>
      </ol>
      <h3>Result Panels</h3>
      <div class="field-doc"><div class="field-doc-name">CTA</div><div class="field-doc-desc">Flags three violation types: <strong>Empty CTA</strong> — a link or button with no visible text; <strong>No link</strong> — a CTA missing a valid <code>href</code>; <strong>URL with space</strong> — an <code>href</code> containing a space character.</div></div>
      <div class="field-doc"><div class="field-doc-name">Links</div><div class="field-doc-desc">Validates link <code>target</code> behavior. <strong>samsung.com</strong> links (including subdomains and QA environments) must open in the same tab; <strong>external</strong> links must use <code>target="_blank"</code>. Click the crosshair icon (⊕) to scroll to any violation on the page.</div></div>
      <div class="field-doc"><div class="field-doc-name">Check My Links</div><div class="field-doc-desc">Fetches every unique link on the page and reports HTTP-level issues: <strong>404 Not Found</strong>, <strong>Blank page</strong> (response under 500 chars), <strong>Geographic redirect</strong> (link redirects to a different country), <strong>Timeout</strong> (no response in 5 s), and <strong>Connection error</strong>. Runs in the background — the extension badge shows the error count when done.</div></div>
      <h3>Background Scan Behavior</h3>
      <p>The HTTP check runs in the service worker and persists even if you close the popup. The browser badge turns red with the error count when the scan finishes. Reopen CTA Check to see the full results.</p>`,

    links_content: `
      <p class="section-intro">Link Check validates the <code>target</code> attribute behavior of all links on the page. Internal domain links must open in the same tab; external links must open in a new tab.</p>
      <h3>The Rule</h3>
      <div class="rule-box">
        <div class="rule-row"><span class="rule-badge ok">Same Tab</span><span>Any link to <code>*.samsung.com</code> (including subdomains and QA environments) must use <code>target="_self"</code> or omit the target attribute entirely.</span></div>
        <div class="rule-row"><span class="rule-badge warn">New Tab</span><span>Any link to an external domain must use <code>target="_blank"</code>.</span></div>
      </div>
      <h3>How to Use</h3>
      <ol>
        <li>Navigate to the page you want to audit</li>
        <li>Open WPC Hub → <strong>QA &amp; Validation → Link Check</strong></li>
        <li>Click <strong>Audit Links</strong></li>
        <li>Review the summary counters (total links, violations)</li>
        <li>Click <strong>Highlight</strong> to mark violation links on the page</li>
        <li>Click the arrow icon (→) next to any violation to scroll to that element on the page</li>
        <li>Click <strong>Copy Report</strong> to export the violation list</li>
      </ol>
      <h3>Domain Detection</h3>
      <p>Detection uses <code>hostname.endsWith('.samsung.com')</code> — covers production (<code>www.samsung.com</code>), regional subdomains, and QA environments (<code>opstools-p1-br.ecom-qa.samsung.com</code>).</p>`,

    overflow_content: `
      <p class="section-intro">Text Clipping detects visually truncated words on the page — text that is cut off mid-word due to container overflow, font metrics, or layout constraints.</p>
      <h3>How to Use</h3>
      <ol>
        <li>Navigate to the page you want to check</li>
        <li>Open WPC Hub → <strong>QA &amp; Validation → Text Clipping</strong></li>
        <li>Click <strong>Scan Page</strong></li>
        <li>Review the results list showing truncated text snippets and their CSS selectors</li>
        <li>Click <strong>Highlight</strong> to mark clipped elements on the page with a red outline</li>
        <li>Click <strong>Copy List</strong> to export the findings</li>
      </ol>
      <h3>Detection Method</h3>
      <p>The scanner uses language-specific word analysis to identify suspicious text endings:</p>
      <ul>
        <li>Checks if text ends with patterns commonly caused by clipping (incomplete words)</li>
        <li>Uses word context triggers (prepositions, articles) to confirm truncation</li>
        <li>Automatically adapts to PT-BR, ES-ES, and EN-US page content</li>
      </ul>
      <div class="tip-box"><strong>Tip:</strong> Especially useful for localized pages where translated text is longer than the original and overflows fixed-size containers.</div>`,

    viewfast_content: `
      <p class="section-intro">Mobile View opens a browser side panel that displays the current page in a mobile-sized viewport (390×844 px, iPhone 14). Useful for quickly checking responsive layouts without switching tools.</p>
      <h3>How to Use</h3>
      <ol>
        <li>Navigate to the page you want to preview</li>
        <li>Open WPC Hub → <strong>QA &amp; Validation → Mobile View</strong></li>
        <li>The popup closes automatically and a <strong>side panel</strong> opens on the right side of the browser window</li>
        <li>The current page loads inside the mobile frame</li>
        <li>Type a new URL in the input field at the top and press <strong>Enter</strong> to navigate</li>
        <li>Click the <strong>refresh icon</strong> to reload the current page in the frame</li>
      </ol>
      <div class="tip-box"><strong>Tip:</strong> The side panel stays open as you browse. Click the WPC Hub icon again to reopen the popup without closing the panel.</div>
      <div class="warn-box"><strong>Note:</strong> Pages protected by <code>X-Frame-Options</code> or <code>Content-Security-Policy</code> headers may not load inside the frame. In that case, use Chrome DevTools mobile emulation instead.</div>`,

    shopapp_content: `
      <p class="section-intro">ShopApp provides visual helpers for inspecting and debugging pages in the ShopApp CMS. Six buttons inject scripts that toggle visual states directly on the page.</p>
      <div class="warn-box"><strong>Important:</strong> ShopApp tools only work on <code>opstools-p1-*.ecom-qa.samsung.com</code> pages. They have no effect on any other URL.</div>
      <h3>Available Controls</h3>
      <h4>Borders</h4>
      <div class="field-doc"><div class="field-doc-name doc-red">Add Border</div><div class="field-doc-desc">Adds a red visual border around ShopApp components to make their boundaries visible during layout inspection.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-green">Hide Border</div><div class="field-doc-desc">Removes all borders added by "Add Border".</div></div>
      <h4>Titles</h4>
      <div class="field-doc"><div class="field-doc-name doc-amber">Show Titles</div><div class="field-doc-desc">Injects component ID labels above each ShopApp block, making it easier to identify which block maps to which CMS entry.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-blue">Hide Titles</div><div class="field-doc-desc">Removes the injected component ID labels.</div></div>
      <h4>Expired Items</h4>
      <div class="field-doc"><div class="field-doc-name doc-purple">Show Expired</div><div class="field-doc-desc">Reveals ShopApp blocks that have passed their expiration date and are hidden by default.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-pink">Hide Expired</div><div class="field-doc-desc">Re-hides expired blocks.</div></div>`,
  },

  pt: {
    page_title: 'WPC Hub — Documentação',
    nav_title: 'WPC Hub',
    nav_subtitle: 'Documentação',
    nav_overview: 'Visão Geral',
    nav_setup: 'Configuração Inicial',
    nav_reporting: 'Relatórios',
    nav_report: 'Report',
    nav_checklist: 'Checklist',
    nav_quicktext: 'QuickText',
    nav_screenshot: 'Screenshot',
    nav_snapslide: 'SnapSlide',
    nav_qa: 'QA & Validação',
    nav_countryscan: 'Content Scan',
    nav_cta: 'CTA Check',
    nav_links: 'Link Check',
    nav_overflow: 'Text Clipping',
    nav_viewfast: 'Mobile View',
    nav_shopapp: 'ShopApp',
    nav_shopapp_tools: 'ShopApp Tools',
    badge_reporting: 'Relatórios',
    badge_qa: 'QA & Validação',
    badge_shopapp: 'ShopApp',
    overview_title: 'Visão Geral',
    setup_title: 'Configuração Inicial',
    report_title: 'Report',
    checklist_title: 'Checklist',
    quicktext_title: 'QuickText',
    screenshot_title: 'Screenshot',
    snapslide_title: 'SnapSlide',
    countryscan_title: 'Content Scan',
    cta_title: 'CTA Check',
    links_title: 'Link Check',
    overflow_title: 'Text Clipping',
    viewfast_title: 'Mobile View',
    shopapp_title: 'ShopApp Tools',

    overview_content: `
      <p class="section-intro">O WPC Hub é uma extensão unificada para o time de QA da WPC. Reúne todas as ferramentas de QA em uma única interface — relatórios, geração de checklists, capturas de tela, validação de links, auditoria de CTAs e muito mais.</p>
      <h3>Grupos da extensão</h3>
      <p>A extensão está organizada em três grupos acessíveis pela barra de navegação superior:</p>
      <div class="group-card reporting-card">
        <div class="group-card-header"><span class="group-dot dot-blue"></span><strong>Relatórios</strong></div>
        <p>Ferramentas para gerar e enviar relatórios de QA, checklists, screenshots e slides anotados. Inclui <strong>Report</strong>, <strong>Checklist</strong>, <strong>QuickText</strong>, <strong>Screenshot</strong> e <strong>SnapSlide</strong>.</p>
      </div>
      <div class="group-card qa-card">
        <div class="group-card-header"><span class="group-dot dot-green"></span><strong>QA &amp; Validação</strong></div>
        <p>Ferramentas de auditoria automática de páginas. Inclui <strong>Content Scan</strong>, <strong>CTA Check</strong>, <strong>Link Check</strong>, <strong>Text Clipping</strong> e <strong>Mobile View</strong>.</p>
      </div>
      <div class="group-card shopapp-card">
        <div class="group-card-header"><span class="group-dot dot-amber"></span><strong>ShopApp</strong></div>
        <p>Helpers visuais para o CMS ShopApp (opstools). Funciona apenas em páginas opstools.</p>
      </div>
      <h3>Compatibilidade</h3>
      <p>O WPC Hub é compatível com <strong>Chrome</strong>, <strong>Edge</strong> e <strong>Firefox</strong> via WebExtensions API.</p>`,

    setup_content: `
      <p class="section-intro">Antes de usar o WPC Hub, configure suas informações de conta e endpoints de API nas Configurações. Acesse pelo ícone de engrenagem (⚙) no cabeçalho — visível apenas quando o grupo Relatórios estiver ativo.</p>
      <h3>Abrindo as Configurações</h3>
      <ol>
        <li>Clique na aba <strong>Reporting</strong> na barra de navegação principal</li>
        <li>Clique no <strong>ícone de engrenagem (⚙)</strong> no canto superior direito do cabeçalho</li>
        <li>O painel de configurações desliza a partir da direita</li>
        <li>Preencha seus dados e clique em <strong>Save Settings</strong></li>
      </ol>
      <h3>Conta</h3>
      <div class="field-doc"><div class="field-doc-name">QA Username</div><div class="field-doc-desc">Seu nome de usuário no time. Preenche automaticamente o campo de usuário no <strong>Report</strong> e no <strong>QuickText</strong>. Substitui o marcador <code>{user_name}</code> nos templates do QuickText.</div></div>
      <div class="field-doc"><div class="field-doc-name">QA ID</div><div class="field-doc-desc">Seu identificador de QA. Usado no nome do arquivo de checklist: <code>QA_ID_YYMMDD_template.xlsx</code>.</div></div>
      <h3>Módulo Report</h3>
      <div class="field-doc"><div class="field-doc-name">URL do Apps Script</div><div class="field-doc-desc">URL do Google Apps Script que recebe os relatórios e os registra no Google Sheets. Peça ao seu líder de equipe se não tiver a URL.</div></div>
      <h3>Módulo SnapSlide</h3>
      <div class="field-doc"><div class="field-doc-name">URL do Apps Script</div><div class="field-doc-desc">URL do Google Apps Script que insere screenshots no Google Slides.</div></div>
      <div class="field-doc"><div class="field-doc-name">ID da Apresentação padrão</div><div class="field-doc-desc">O ID da apresentação do Google Slides de destino. Encontrado na URL do Slides: <code>docs.google.com/presentation/d/<strong>[ID]</strong>/edit</code>.</div></div>
      <h3>Templates do QuickText</h3>
      <p>Selecione um template no menu, edite o conteúdo na área de texto e salve. Use <code>{user_name}</code> onde quiser — será substituído pelo seu QA Username ao copiar. Clique em <strong>Reset to default</strong> para restaurar o texto original.</p>`,

    report_content: `
      <p class="section-intro">O módulo Report envia um relatório de QA estruturado para o Google Sheets via Google Apps Script. Cada relatório registra o resultado do teste, categoria da página, país/região e observações opcionais.</p>
      <h3>Pré-requisitos</h3>
      <p>Configure a <strong>URL do Apps Script</strong> e o <strong>QA Username</strong> nas Configurações antes de enviar relatórios.</p>
      <h3>Como usar</h3>
      <ol>
        <li>Selecione a <strong>Category</strong> — o tipo de página sendo testada (ex: ShopApp, PDP, HOME)</li>
        <li>Selecione o <strong>Sub</strong> — o país/região (ex: BR, CO, LATIN)</li>
        <li>Selecione o <strong>Status</strong> — APPROVED, REJECTED, FIXED ou PENDING</li>
        <li>Preencha opcionalmente <strong>Publisher Error</strong> e <strong>Pending Customer</strong></li>
        <li>Selecione opcionalmente um <strong>Reason for adjustment</strong></li>
        <li>Insira seu <strong>QA Username</strong> (preenchido automaticamente se salvo nas Configurações)</li>
        <li>Adicione <strong>Comments</strong> opcionais — use o botão <strong>Translate</strong> para traduzir PT→EN</li>
        <li>Clique em <strong>Send Report</strong> — o popup fecha automaticamente ao enviar</li>
      </ol>
      <div class="tip-box"><strong>Dica:</strong> Clique no botão <strong>Sheets</strong> para abrir o log do Google Sheets em uma nova aba.</div>
      <h3>Referência dos campos</h3>
      <div class="field-doc"><div class="field-doc-name">Category</div><div class="field-doc-desc">ShopApp · Static Page · PCD · PDP · GNB/Footer · PF · Buy Page · HOME · PFS · MKT · Offer · EOL redirect · EPP · Business page · SEO</div></div>
      <div class="field-doc"><div class="field-doc-name">Sub</div><div class="field-doc-desc">BR · CO · LATIN · LATIN_EN · MX · CL · PE · AR · PY · UY · EURO</div></div>
      <div class="field-doc"><div class="field-doc-name">Status</div><div class="field-doc-desc"><strong>APPROVED</strong> — aprovado · <strong>REJECTED</strong> — reprovado · <strong>FIXED</strong> — corrigido · <strong>PENDING</strong> — pendente</div></div>`,

    checklist_content: `
      <p class="section-intro">O módulo Checklist gera um arquivo Excel (.xlsx) de checklist de QA pré-preenchido, nomeado automaticamente com seu QA ID e a data atual.</p>
      <h3>Como usar</h3>
      <ol>
        <li>Insira seu <strong>QA ID</strong> (preenchido automaticamente se salvo) e clique no ícone de salvar</li>
        <li>Marque um ou mais <strong>templates</strong> correspondentes aos tipos de página que você está testando</li>
        <li>Clique em <strong>Create Checklist</strong> para gerar o arquivo</li>
        <li>Clique em <strong>Download</strong> para salvar o arquivo .xlsx</li>
      </ol>
      <h3>Templates disponíveis</h3>
      <div class="template-grid">
        <span class="template-tag">Standard</span><span class="template-tag">FOOTER</span>
        <span class="template-tag">GNB</span><span class="template-tag">HOME</span>
        <span class="template-tag">OFFER</span><span class="template-tag">PCD</span>
        <span class="template-tag">PDP</span><span class="template-tag">PF</span>
        <span class="template-tag">PFS Home</span><span class="template-tag">PFS Mobile</span>
        <span class="template-tag">Redirect</span>
      </div>
      <h3>Nomenclatura do arquivo</h3>
      <p>Padrão: <code>QA_ID_YYMMDD_NomeTemplate.xlsx</code></p>
      <p>Exemplo: <code>JD01_260615_Standard.xlsx</code></p>
      <div class="tip-box"><strong>Dica:</strong> Selecione vários templates de uma vez — um arquivo separado é gerado para cada template selecionado.</div>`,

    quicktext_content: `
      <p class="section-intro">O QuickText permite copiar templates de comentários de QA com um único clique. Clique em qualquer botão para copiar o texto para a área de transferência — o popup fecha automaticamente após a cópia.</p>
      <h3>Como usar</h3>
      <ol>
        <li>Insira seu <strong>QA Username</strong> (preenchido automaticamente se salvo nas Configurações)</li>
        <li>Navegue pelos botões de template organizados por categoria</li>
        <li>Clique em qualquer template — o texto é copiado instantaneamente</li>
        <li>Um ícone de confirmação (✓) aparece indicando que a cópia foi bem-sucedida</li>
        <li>Cole o texto no seu ticket ou campo de comentário</li>
      </ol>
      <h3>Categorias de templates</h3>
      <div class="category-row"><span class="cat-badge cat-approved">Approved</span><span>Templates para páginas que passaram na revisão de QA</span></div>
      <div class="category-row"><span class="cat-badge cat-rejected">Rejected</span><span>Templates para páginas que falharam na revisão de QA</span></div>
      <div class="category-row"><span class="cat-badge cat-shopapp">ShopApp</span><span>Templates específicos para fluxos do CMS ShopApp</span></div>
      <h3>Marcador de nome de usuário</h3>
      <p>Os templates podem incluir o marcador <code>{user_name}</code>, que é substituído automaticamente pelo seu QA Username salvo ao clicar no template. Personalize qualquer template em <strong>Configurações → QuickText Templates</strong>.</p>`,

    screenshot_content: `
      <p class="section-intro">O módulo Screenshot captura uma imagem da viewport visível da aba ativa do navegador. A imagem pode ser baixada como PNG ou copiada para a área de transferência.</p>
      <h3>Como usar</h3>
      <ol>
        <li>Navegue até a página que deseja capturar</li>
        <li>Abra o WPC Hub → <strong>Reporting → Screenshot</strong></li>
        <li>Clique em <strong>Capture Full Page</strong></li>
        <li>Uma prévia da captura aparece abaixo do botão</li>
        <li>Clique em <strong>Download PNG</strong> para salvar, ou <strong>Copy Image</strong> para copiar</li>
      </ol>
      <div class="tip-box"><strong>Dica:</strong> Os arquivos baixados são nomeados automaticamente com um timestamp: <code>screenshot_YYYYMMDD_HHMMSS.png</code>.</div>`,

    snapslide_content: `
      <p class="section-intro">O SnapSlide captura um screenshot da área de transferência e o envia — junto com metadados de erro — diretamente para uma apresentação do Google Slides via Google Apps Script.</p>
      <h3>Pré-requisitos</h3>
      <p>Configure a <strong>URL do Apps Script do SnapSlide</strong> e o <strong>ID da Apresentação padrão</strong> nas Configurações.</p>
      <h3>Como usar</h3>
      <ol>
        <li>Tire um screenshot do problema na página usando a ferramenta do seu sistema operacional</li>
        <li>Copie o screenshot para a área de transferência (<strong>Ctrl+C</strong> ou atalho do SO)</li>
        <li>Abra o WPC Hub → <strong>Reporting → SnapSlide</strong></li>
        <li>Confirme ou insira o <strong>ID da Apresentação</strong></li>
        <li>Clique na área do canvas e pressione <strong>Ctrl+V</strong> para colar o screenshot</li>
        <li>Preencha o <strong>Page Type</strong> (ex: Home, PDP)</li>
        <li>Selecione uma <strong>Error Category</strong> no menu</li>
        <li>Opcionalmente escreva uma <strong>Error Description</strong> (botão Translate disponível)</li>
        <li>Clique em <strong>Send to Slides</strong></li>
      </ol>
      <div class="tip-box"><strong>Dica:</strong> Clique no botão <strong>Slides</strong> para abrir a apresentação de destino em uma nova aba.</div>`,

    countryscan_content: `
      <p class="section-intro">O Content Scan analisa a página ativa para detectar idioma, país, composição de script e problemas específicos de QA, como links de CTA apontando para o país errado ou assets com país incompatível.</p>
      <h3>Como usar</h3>
      <ol>
        <li>Navegue até a página que deseja escanear</li>
        <li>Abra o WPC Hub → <strong>QA &amp; Validação → Content Scan</strong></li>
        <li>Opcionalmente selecione um <strong>idioma</strong> manualmente (padrão: detecção automática)</li>
        <li>Clique em <strong>Scan</strong></li>
        <li>Revise os resultados: informações da página, idioma detectado, contagem de palavras/caracteres, composição de script</li>
      </ol>
      <h3>Resultados do scan</h3>
      <div class="field-doc"><div class="field-doc-name">Title / URL / Country</div><div class="field-doc-desc">Metadados básicos extraídos da aba ativa.</div></div>
      <div class="field-doc"><div class="field-doc-name">Idioma detectado</div><div class="field-doc-desc">Idioma identificado na página com barra de porcentagem de confiança.</div></div>
      <div class="field-doc"><div class="field-doc-name">Palavras / Caracteres</div><div class="field-doc-desc">Total de conteúdo de texto visível contado na página.</div></div>
      <div class="field-doc"><div class="field-doc-name">Composição de Script</div><div class="field-doc-desc">Distribuição dos sistemas de escrita detectados (Latino, Cirílico, CJK, Árabe, etc.) em barras de porcentagem.</div></div>
      <h3>Ferramentas QA (Acordeão)</h3>
      <p>Clique no acordeão <strong>QA Tools</strong> para expandir verificações adicionais:</p>
      <div class="field-doc"><div class="field-doc-name">Asset Country Check</div><div class="field-doc-desc">Escaneia URLs de imagens e sinaliza assets cujo código de país na URL não corresponde ao país esperado da página.</div></div>
      <div class="field-doc"><div class="field-doc-name">CTA Country Check</div><div class="field-doc-desc">Inspeciona URLs de links de CTA e sinaliza links apontando para um subdomínio de país diferente do esperado.</div></div>`,

    cta_content: `
      <p class="section-intro">O CTA Check é uma auditoria unificada de página. Um clique em <strong>Scan Page</strong> executa três verificações ao mesmo tempo: violações de CTA, comportamento de target de links e verificação HTTP de todos os links da página — todos os resultados organizados em painéis de acordeão recolhíveis.</p>
      <h3>Como usar</h3>
      <ol>
        <li>Navegue até a página que deseja auditar</li>
        <li>Abra o WPC Hub → <strong>QA &amp; Validação → CTA Check</strong></li>
        <li>Clique em <strong>Scan Page</strong></li>
        <li>Uma barra de progresso aparece enquanto a verificação HTTP roda em segundo plano — você pode fechar o popup e voltar depois</li>
        <li>Quando todas as verificações terminam, três painéis de resultado aparecem — seções com violações abrem automaticamente</li>
        <li>Clique no cabeçalho de qualquer painel para expandir ou recolher</li>
        <li>Clique em <strong>Highlight All</strong> para marcar violações de CTA e links na página com bordas coloridas</li>
        <li>Clique em <strong>Copy Report</strong> para exportar as três seções para a área de transferência</li>
        <li>Clique em <strong>Clear results</strong> para resetar e executar um novo scan</li>
      </ol>
      <h3>Painéis de resultado</h3>
      <div class="field-doc"><div class="field-doc-name">CTA</div><div class="field-doc-desc">Sinaliza três tipos de violação: <strong>CTA Vazio</strong> — link ou botão sem texto visível; <strong>Sem link</strong> — CTA sem <code>href</code> válido; <strong>URL com espaço</strong> — <code>href</code> contendo espaço.</div></div>
      <div class="field-doc"><div class="field-doc-name">Links</div><div class="field-doc-desc">Valida o comportamento do atributo <code>target</code>. Links para <strong>samsung.com</strong> (incluindo subdomínios e ambientes QA) devem abrir na mesma aba; links <strong>externos</strong> devem usar <code>target="_blank"</code>. Clique no ícone de mira (⊕) para rolar até a violação na página.</div></div>
      <div class="field-doc"><div class="field-doc-name">Check My Links</div><div class="field-doc-desc">Busca todos os links únicos da página e reporta problemas em nível HTTP: <strong>404 Not Found</strong>, <strong>Página em branco</strong> (resposta com menos de 500 caracteres), <strong>Redirecionamento geográfico</strong> (link redireciona para outro país), <strong>Timeout</strong> (sem resposta em 5 s) e <strong>Erro de conexão</strong>. Roda em segundo plano — o badge da extensão exibe a contagem de erros ao finalizar.</div></div>
      <h3>Comportamento em segundo plano</h3>
      <p>A verificação HTTP roda no service worker e persiste mesmo se você fechar o popup. O badge do navegador fica vermelho com a contagem de erros ao terminar. Reabra o CTA Check para ver os resultados completos.</p>`,

    links_content: `
      <p class="section-intro">O Link Check valida o comportamento do atributo <code>target</code> de todos os links da página. Links para o domínio interno devem abrir na mesma aba; links externos devem abrir em nova aba.</p>
      <h3>A Regra</h3>
      <div class="rule-box">
        <div class="rule-row"><span class="rule-badge ok">Mesma Aba</span><span>Links para <code>*.samsung.com</code> (incluindo subdomínios e ambientes de QA) devem usar <code>target="_self"</code> ou não ter atributo target.</span></div>
        <div class="rule-row"><span class="rule-badge warn">Nova Aba</span><span>Links para domínios externos devem usar <code>target="_blank"</code>.</span></div>
      </div>
      <h3>Como usar</h3>
      <ol>
        <li>Navegue até a página que deseja auditar</li>
        <li>Abra o WPC Hub → <strong>QA &amp; Validação → Link Check</strong></li>
        <li>Clique em <strong>Audit Links</strong></li>
        <li>Revise os contadores de resumo (total de links, violações)</li>
        <li>Clique em <strong>Highlight</strong> para marcar links com violação na página</li>
        <li>Clique na seta (→) ao lado de qualquer violação para rolar até o elemento na página</li>
        <li>Clique em <strong>Copy Report</strong> para exportar a lista de violações</li>
      </ol>`,

    overflow_content: `
      <p class="section-intro">O Text Clipping detecta palavras visualmente truncadas na página — texto cortado no meio por overflow de container, métricas de fonte ou restrições de layout.</p>
      <h3>Como usar</h3>
      <ol>
        <li>Navegue até a página que deseja verificar</li>
        <li>Abra o WPC Hub → <strong>QA &amp; Validação → Text Clipping</strong></li>
        <li>Clique em <strong>Scan Page</strong></li>
        <li>Revise a lista de resultados com trechos de texto truncado e seus seletores CSS</li>
        <li>Clique em <strong>Highlight</strong> para marcar os elementos cortados na página com contorno vermelho</li>
        <li>Clique em <strong>Copy List</strong> para exportar os resultados</li>
      </ol>
      <div class="tip-box"><strong>Dica:</strong> Especialmente útil em páginas localizadas onde o texto traduzido é mais longo que o original e extrapola containers de tamanho fixo.</div>`,

    viewfast_content: `
      <p class="section-intro">O Mobile View abre um painel lateral no navegador que exibe a página atual em um viewport de tamanho mobile (390×844 px, iPhone 14). Útil para verificar rapidamente layouts responsivos sem trocar de ferramenta.</p>
      <h3>Como usar</h3>
      <ol>
        <li>Navegue até a página que deseja visualizar</li>
        <li>Abra o WPC Hub → <strong>QA &amp; Validação → Mobile View</strong></li>
        <li>O popup fecha automaticamente e um <strong>painel lateral</strong> abre no lado direito do navegador</li>
        <li>A página atual carrega dentro do frame mobile</li>
        <li>Digite uma nova URL no campo de entrada no topo e pressione <strong>Enter</strong> para navegar</li>
        <li>Clique no <strong>ícone de atualizar</strong> para recarregar a página no frame</li>
      </ol>
      <div class="warn-box"><strong>Atenção:</strong> Páginas protegidas por <code>X-Frame-Options</code> ou <code>Content-Security-Policy</code> podem não carregar dentro do frame. Nesse caso, use a emulação mobile do Chrome DevTools.</div>`,

    shopapp_content: `
      <p class="section-intro">O ShopApp oferece helpers visuais para inspecionar e depurar páginas no CMS ShopApp. Seis botões injetam scripts que alternam estados visuais diretamente na página.</p>
      <div class="warn-box"><strong>Importante:</strong> As ferramentas ShopApp funcionam apenas em páginas <code>opstools-p1-*.ecom-qa.samsung.com</code>. Não têm efeito em nenhuma outra URL.</div>
      <h3>Controles disponíveis</h3>
      <h4>Bordas</h4>
      <div class="field-doc"><div class="field-doc-name doc-red">Add Border</div><div class="field-doc-desc">Adiciona uma borda visual vermelha em volta dos componentes do ShopApp para tornar seus limites visíveis durante a inspeção de layout.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-green">Hide Border</div><div class="field-doc-desc">Remove todas as bordas adicionadas pelo "Add Border".</div></div>
      <h4>Títulos</h4>
      <div class="field-doc"><div class="field-doc-name doc-amber">Show Titles</div><div class="field-doc-desc">Injeta labels com ID de componente acima de cada bloco ShopApp, facilitando a identificação de qual bloco corresponde a qual entrada no CMS.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-blue">Hide Titles</div><div class="field-doc-desc">Remove os labels de ID de componente injetados.</div></div>
      <h4>Itens Expirados</h4>
      <div class="field-doc"><div class="field-doc-name doc-purple">Show Expired</div><div class="field-doc-desc">Revela os blocos ShopApp que passaram da data de expiração e estão ocultos por padrão.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-pink">Hide Expired</div><div class="field-doc-desc">Reesconde os blocos expirados.</div></div>`,
  },

  es: {
    page_title: 'WPC Hub — Documentación',
    nav_title: 'WPC Hub',
    nav_subtitle: 'Documentación',
    nav_overview: 'Descripción General',
    nav_setup: 'Configuración Inicial',
    nav_reporting: 'Reportes',
    nav_report: 'Report',
    nav_checklist: 'Checklist',
    nav_quicktext: 'QuickText',
    nav_screenshot: 'Screenshot',
    nav_snapslide: 'SnapSlide',
    nav_qa: 'QA & Validación',
    nav_countryscan: 'Content Scan',
    nav_cta: 'CTA Check',
    nav_links: 'Link Check',
    nav_overflow: 'Text Clipping',
    nav_viewfast: 'Mobile View',
    nav_shopapp: 'ShopApp',
    nav_shopapp_tools: 'ShopApp Tools',
    badge_reporting: 'Reportes',
    badge_qa: 'QA & Validación',
    badge_shopapp: 'ShopApp',
    overview_title: 'Descripción General',
    setup_title: 'Configuración Inicial',
    report_title: 'Report',
    checklist_title: 'Checklist',
    quicktext_title: 'QuickText',
    screenshot_title: 'Screenshot',
    snapslide_title: 'SnapSlide',
    countryscan_title: 'Content Scan',
    cta_title: 'CTA Check',
    links_title: 'Link Check',
    overflow_title: 'Text Clipping',
    viewfast_title: 'Mobile View',
    shopapp_title: 'ShopApp Tools',

    overview_content: `
      <p class="section-intro">WPC Hub es una extensión unificada para el equipo de QA de WPC. Reúne todas las herramientas de QA en una sola interfaz — reportes, generación de checklists, capturas de pantalla, validación de enlaces, auditoría de CTAs y más.</p>
      <h3>Grupos de la extensión</h3>
      <p>La extensión está organizada en tres grupos accesibles desde la barra de navegación superior:</p>
      <div class="group-card reporting-card">
        <div class="group-card-header"><span class="group-dot dot-blue"></span><strong>Reportes</strong></div>
        <p>Herramientas para generar y enviar reportes de QA, checklists, capturas de pantalla y diapositivas anotadas. Incluye <strong>Report</strong>, <strong>Checklist</strong>, <strong>QuickText</strong>, <strong>Screenshot</strong> y <strong>SnapSlide</strong>.</p>
      </div>
      <div class="group-card qa-card">
        <div class="group-card-header"><span class="group-dot dot-green"></span><strong>QA &amp; Validación</strong></div>
        <p>Herramientas de auditoría automática de páginas. Incluye <strong>Content Scan</strong>, <strong>CTA Check</strong>, <strong>Link Check</strong>, <strong>Text Clipping</strong> y <strong>Mobile View</strong>.</p>
      </div>
      <div class="group-card shopapp-card">
        <div class="group-card-header"><span class="group-dot dot-amber"></span><strong>ShopApp</strong></div>
        <p>Ayudas visuales para el CMS ShopApp (opstools). Solo funciona en páginas opstools.</p>
      </div>
      <h3>Compatibilidad</h3>
      <p>WPC Hub es compatible con <strong>Chrome</strong>, <strong>Edge</strong> y <strong>Firefox</strong> a través de la API WebExtensions.</p>`,

    setup_content: `
      <p class="section-intro">Antes de usar WPC Hub, configure su información de cuenta y los endpoints de API en Configuración. Acceda mediante el ícono de engranaje (⚙) en el encabezado — solo visible cuando el grupo Reportes está activo.</p>
      <h3>Abrir Configuración</h3>
      <ol>
        <li>Haga clic en la pestaña <strong>Reporting</strong> en la barra de navegación principal</li>
        <li>Haga clic en el <strong>ícono de engranaje (⚙)</strong> en la esquina superior derecha del encabezado</li>
        <li>El panel de configuración se desliza desde la derecha</li>
        <li>Complete sus datos y haga clic en <strong>Save Settings</strong></li>
      </ol>
      <h3>Cuenta</h3>
      <div class="field-doc"><div class="field-doc-name">QA Username</div><div class="field-doc-desc">Su nombre de usuario en el equipo. Completa automáticamente el campo de usuario en <strong>Report</strong> y <strong>QuickText</strong>. Reemplaza el marcador <code>{user_name}</code> en los templates de QuickText.</div></div>
      <div class="field-doc"><div class="field-doc-name">QA ID</div><div class="field-doc-desc">Su identificador de QA. Se usa en el nombre del archivo de checklist: <code>QA_ID_YYMMDD_template.xlsx</code>.</div></div>
      <h3>Módulo Report</h3>
      <div class="field-doc"><div class="field-doc-name">URL del Apps Script</div><div class="field-doc-desc">URL de Google Apps Script que recibe los reportes y los escribe en Google Sheets. Consulte a su líder de equipo si no tiene esta URL.</div></div>
      <h3>Módulo SnapSlide</h3>
      <div class="field-doc"><div class="field-doc-name">URL del Apps Script</div><div class="field-doc-desc">URL de Google Apps Script que inserta capturas de pantalla en Google Slides.</div></div>
      <div class="field-doc"><div class="field-doc-name">ID de presentación predeterminado</div><div class="field-doc-desc">El ID de la presentación de Google Slides de destino. Se encuentra en la URL de Slides: <code>docs.google.com/presentation/d/<strong>[ID]</strong>/edit</code>.</div></div>`,

    report_content: `
      <p class="section-intro">El módulo Report envía un reporte de QA estructurado a Google Sheets mediante Google Apps Script. Cada reporte registra el resultado de la prueba, categoría de página, país/región y notas opcionales.</p>
      <h3>Cómo usar</h3>
      <ol>
        <li>Seleccione la <strong>Category</strong> — el tipo de página que se está probando</li>
        <li>Seleccione el <strong>Sub</strong> — el país/región (ej: BR, CO, LATIN)</li>
        <li>Seleccione el <strong>Status</strong> — APPROVED, REJECTED, FIXED o PENDING</li>
        <li>Complete opcionalmente <strong>Publisher Error</strong> y <strong>Pending Customer</strong></li>
        <li>Ingrese su <strong>QA Username</strong> (se completa automáticamente si está guardado)</li>
        <li>Agregue <strong>Comments</strong> opcionales — use el botón <strong>Translate</strong> para traducir PT→EN</li>
        <li>Haga clic en <strong>Send Report</strong> — el popup se cierra automáticamente al enviar</li>
      </ol>
      <div class="tip-box"><strong>Consejo:</strong> Haga clic en el botón <strong>Sheets</strong> para abrir el registro de Google Sheets en una nueva pestaña.</div>`,

    checklist_content: `
      <p class="section-intro">El módulo Checklist genera un archivo Excel (.xlsx) de lista de verificación de QA prellenado, nombrado automáticamente con su QA ID y la fecha actual.</p>
      <h3>Cómo usar</h3>
      <ol>
        <li>Ingrese su <strong>QA ID</strong> (se completa automáticamente si está guardado) y haga clic en el ícono de guardar</li>
        <li>Marque uno o más <strong>templates</strong> que correspondan a los tipos de página que está probando</li>
        <li>Haga clic en <strong>Create Checklist</strong> para generar el archivo</li>
        <li>Haga clic en <strong>Download</strong> para guardar el archivo .xlsx</li>
      </ol>
      <h3>Nomenclatura del archivo</h3>
      <p>Patrón: <code>QA_ID_YYMMDD_NombreTemplate.xlsx</code></p>`,

    quicktext_content: `
      <p class="section-intro">QuickText permite copiar templates de comentarios de QA con un solo clic. Haga clic en cualquier botón para copiar el texto al portapapeles — el popup se cierra automáticamente.</p>
      <h3>Cómo usar</h3>
      <ol>
        <li>Ingrese su <strong>QA Username</strong> (se completa automáticamente si está guardado)</li>
        <li>Explore los botones de template organizados por categoría</li>
        <li>Haga clic en cualquier template — el texto se copia instantáneamente</li>
        <li>Pegue el texto en su ticket o campo de comentario</li>
      </ol>
      <h3>Marcador de nombre de usuario</h3>
      <p>Los templates pueden incluir el marcador <code>{user_name}</code>, reemplazado automáticamente con su QA Username guardado. Personalice cualquier template en <strong>Configuración → QuickText Templates</strong>.</p>`,

    screenshot_content: `
      <p class="section-intro">El módulo Screenshot captura una imagen del viewport visible de la pestaña activa del navegador. La imagen capturada puede descargarse como PNG o copiarse al portapapeles.</p>
      <h3>Cómo usar</h3>
      <ol>
        <li>Navegue a la página que desea capturar</li>
        <li>Abra WPC Hub → <strong>Reporting → Screenshot</strong></li>
        <li>Haga clic en <strong>Capture Full Page</strong></li>
        <li>Aparece una vista previa de la captura</li>
        <li>Haga clic en <strong>Download PNG</strong> para guardar, o <strong>Copy Image</strong> para copiar</li>
      </ol>`,

    snapslide_content: `
      <p class="section-intro">SnapSlide captura una imagen del portapapeles y la envía — junto con metadatos del error — directamente a una presentación de Google Slides mediante Google Apps Script.</p>
      <h3>Cómo usar</h3>
      <ol>
        <li>Tome una captura de pantalla del problema con la herramienta de su sistema operativo</li>
        <li>Copie la captura al portapapeles (<strong>Ctrl+C</strong>)</li>
        <li>Abra WPC Hub → <strong>Reporting → SnapSlide</strong></li>
        <li>Confirme o ingrese el <strong>ID de la presentación</strong></li>
        <li>Haga clic en el área del canvas y presione <strong>Ctrl+V</strong> para pegar la captura</li>
        <li>Complete el <strong>Page Type</strong> y seleccione una <strong>Error Category</strong></li>
        <li>Haga clic en <strong>Send to Slides</strong></li>
      </ol>`,

    countryscan_content: `
      <p class="section-intro">Content Scan analiza la página activa para detectar idioma, país, composición de scripts y problemas específicos de QA como enlaces CTA apuntando al país incorrecto.</p>
      <h3>Cómo usar</h3>
      <ol>
        <li>Navegue a la página que desea analizar</li>
        <li>Abra WPC Hub → <strong>QA &amp; Validación → Content Scan</strong></li>
        <li>Seleccione opcionalmente un <strong>idioma</strong> (predeterminado: detección automática)</li>
        <li>Haga clic en <strong>Scan</strong></li>
        <li>Revise los resultados: información de la página, idioma detectado, recuento de palabras/caracteres</li>
      </ol>`,

    cta_content: `
      <p class="section-intro">CTA Check es una auditoría de página unificada. Un clic en <strong>Scan Page</strong> ejecuta tres verificaciones al mismo tiempo: violaciones de CTA, comportamiento de target de enlaces y verificación HTTP de todos los enlaces de la página — todos los resultados organizados en paneles de acordeón plegables.</p>
      <h3>Cómo usar</h3>
      <ol>
        <li>Navegue a la página que desea auditar</li>
        <li>Abra WPC Hub → <strong>QA &amp; Validación → CTA Check</strong></li>
        <li>Haga clic en <strong>Scan Page</strong></li>
        <li>Una barra de progreso aparece mientras la verificación HTTP se ejecuta en segundo plano — puede cerrar el popup y regresar más tarde</li>
        <li>Cuando todas las verificaciones terminan, aparecen tres paneles de resultados — las secciones con violaciones se abren automáticamente</li>
        <li>Haga clic en el encabezado de cualquier panel para expandirlo o colapsarlo</li>
        <li>Use <strong>Highlight All</strong> para marcar violaciones de CTA y enlaces en la página</li>
        <li>Use <strong>Copy Report</strong> para exportar las tres secciones al portapapeles</li>
        <li>Use <strong>Clear results</strong> para restablecer y ejecutar un nuevo escaneo</li>
      </ol>
      <h3>Paneles de resultado</h3>
      <div class="field-doc"><div class="field-doc-name">CTA</div><div class="field-doc-desc">Marca tres tipos de violación: <strong>CTA Vacío</strong> — enlace o botón sin texto visible; <strong>Sin enlace</strong> — CTA sin <code>href</code> válido; <strong>URL con espacio</strong> — <code>href</code> que contiene un espacio.</div></div>
      <div class="field-doc"><div class="field-doc-name">Links</div><div class="field-doc-desc">Valida el comportamiento del atributo <code>target</code>. Los enlaces a <strong>samsung.com</strong> (incluidos subdominios y entornos QA) deben abrir en la misma pestaña; los enlaces <strong>externos</strong> deben usar <code>target="_blank"</code>. Haga clic en el ícono de diana (⊕) para desplazarse hasta la violación en la página.</div></div>
      <div class="field-doc"><div class="field-doc-name">Check My Links</div><div class="field-doc-desc">Obtiene todos los enlaces únicos de la página y reporta problemas HTTP: <strong>404 Not Found</strong>, <strong>Página en blanco</strong> (respuesta con menos de 500 caracteres), <strong>Redirección geográfica</strong> (enlace redirige a otro país), <strong>Timeout</strong> (sin respuesta en 5 s) y <strong>Error de conexión</strong>. Se ejecuta en segundo plano — el badge de la extensión muestra el recuento de errores al finalizar.</div></div>`,

    links_content: `
      <p class="section-intro">Link Check valida el comportamiento del atributo <code>target</code> de todos los enlaces de la página. Los enlaces al dominio interno deben abrir en la misma pestaña; los externos en una nueva pestaña.</p>
      <h3>La Regla</h3>
      <div class="rule-box">
        <div class="rule-row"><span class="rule-badge ok">Misma Pestaña</span><span>Los enlaces a <code>*.samsung.com</code> deben usar <code>target="_self"</code> u omitir el atributo target.</span></div>
        <div class="rule-row"><span class="rule-badge warn">Nueva Pestaña</span><span>Los enlaces a dominios externos deben usar <code>target="_blank"</code>.</span></div>
      </div>
      <h3>Cómo usar</h3>
      <ol>
        <li>Abra WPC Hub → <strong>QA &amp; Validación → Link Check</strong></li>
        <li>Haga clic en <strong>Audit Links</strong></li>
        <li>Revise el resumen y use <strong>Highlight</strong> para marcar violaciones en la página</li>
      </ol>`,

    overflow_content: `
      <p class="section-intro">Text Clipping detecta palabras visualmente truncadas en la página — texto cortado a la mitad por desbordamiento del contenedor o restricciones de diseño.</p>
      <h3>Cómo usar</h3>
      <ol>
        <li>Navegue a la página que desea verificar</li>
        <li>Abra WPC Hub → <strong>QA &amp; Validación → Text Clipping</strong></li>
        <li>Haga clic en <strong>Scan Page</strong></li>
        <li>Revise la lista con fragmentos de texto truncado y sus selectores CSS</li>
        <li>Use <strong>Highlight</strong> para marcar elementos cortados y <strong>Copy List</strong> para exportar</li>
      </ol>`,

    viewfast_content: `
      <p class="section-intro">Mobile View abre un panel lateral en el navegador que muestra la página actual en un viewport de tamaño móvil (390×844 px, iPhone 14).</p>
      <h3>Cómo usar</h3>
      <ol>
        <li>Navegue a la página que desea previsualizar</li>
        <li>Abra WPC Hub → <strong>QA &amp; Validación → Mobile View</strong></li>
        <li>El popup se cierra automáticamente y se abre un <strong>panel lateral</strong> a la derecha</li>
        <li>La página actual carga dentro del marco móvil</li>
        <li>Escriba una nueva URL en el campo de entrada y presione <strong>Enter</strong> para navegar</li>
      </ol>`,

    shopapp_content: `
      <p class="section-intro">ShopApp proporciona ayudas visuales para inspeccionar y depurar páginas en el CMS ShopApp. Seis botones inyectan scripts que alternan estados visuales directamente en la página.</p>
      <div class="warn-box"><strong>Importante:</strong> Las herramientas ShopApp solo funcionan en páginas <code>opstools-p1-*.ecom-qa.samsung.com</code>.</div>
      <h3>Controles disponibles</h3>
      <h4>Bordes</h4>
      <div class="field-doc"><div class="field-doc-name doc-red">Add Border</div><div class="field-doc-desc">Agrega un borde visual rojo alrededor de los componentes ShopApp para hacer visibles sus límites.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-green">Hide Border</div><div class="field-doc-desc">Elimina todos los bordes agregados por "Add Border".</div></div>
      <h4>Títulos</h4>
      <div class="field-doc"><div class="field-doc-name doc-amber">Show Titles</div><div class="field-doc-desc">Inyecta etiquetas con ID de componente sobre cada bloque ShopApp.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-blue">Hide Titles</div><div class="field-doc-desc">Elimina las etiquetas de ID de componente inyectadas.</div></div>
      <h4>Elementos Expirados</h4>
      <div class="field-doc"><div class="field-doc-name doc-purple">Show Expired</div><div class="field-doc-desc">Revela los bloques ShopApp con fecha de expiración vencida, ocultos por defecto.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-pink">Hide Expired</div><div class="field-doc-desc">Vuelve a ocultar los bloques expirados.</div></div>`,
  },

  ko: {
    page_title: 'WPC Hub — 문서',
    nav_title: 'WPC Hub',
    nav_subtitle: '문서',
    nav_overview: '개요',
    nav_setup: '초기 설정',
    nav_reporting: '리포팅',
    nav_report: '리포트',
    nav_checklist: '체크리스트',
    nav_quicktext: '퀵텍스트',
    nav_screenshot: '스크린샷',
    nav_snapslide: '스냅슬라이드',
    nav_qa: 'QA & 검증',
    nav_countryscan: '콘텐츠 스캔',
    nav_cta: 'CTA 검사',
    nav_links: '링크 검사',
    nav_overflow: '텍스트 클리핑',
    nav_viewfast: '모바일 뷰',
    nav_shopapp: '샵앱',
    nav_shopapp_tools: '샵앱 도구',
    badge_reporting: '리포팅',
    badge_qa: 'QA & 검증',
    badge_shopapp: '샵앱',
    overview_title: '개요',
    setup_title: '초기 설정',
    report_title: '리포트',
    checklist_title: '체크리스트',
    quicktext_title: '퀵텍스트',
    screenshot_title: '스크린샷',
    snapslide_title: '스냅슬라이드',
    countryscan_title: '콘텐츠 스캔',
    cta_title: 'CTA 검사',
    links_title: '링크 검사',
    overflow_title: '텍스트 클리핑',
    viewfast_title: '모바일 뷰',
    shopapp_title: '샵앱 도구',

    overview_content: `
      <p class="section-intro">WPC Hub는 WPC QA 팀을 위한 통합 브라우저 확장 프로그램입니다. 보고서 작성, 체크리스트 생성, 스크린샷 캡처, 링크 검증, CTA 감사 등 모든 QA 도구를 하나의 인터페이스에서 제공합니다.</p>
      <h3>확장 프로그램 그룹</h3>
      <p>확장 프로그램은 상단 탐색 표시줄에서 접근 가능한 세 가지 그룹으로 구성되어 있습니다:</p>
      <div class="group-card reporting-card">
        <div class="group-card-header"><span class="group-dot dot-blue"></span><strong>리포팅</strong></div>
        <p>QA 보고서, 체크리스트, 스크린샷 및 주석이 달린 슬라이드를 생성하고 전송하는 도구입니다. <strong>Report</strong>, <strong>Checklist</strong>, <strong>QuickText</strong>, <strong>Screenshot</strong>, <strong>SnapSlide</strong>가 포함됩니다.</p>
      </div>
      <div class="group-card qa-card">
        <div class="group-card-header"><span class="group-dot dot-green"></span><strong>QA &amp; 검증</strong></div>
        <p>자동화된 페이지 감사 도구입니다. <strong>콘텐츠 스캔</strong>, <strong>CTA 검사</strong>, <strong>링크 검사</strong>, <strong>텍스트 클리핑</strong>, <strong>모바일 뷰</strong>가 포함됩니다.</p>
      </div>
      <div class="group-card shopapp-card">
        <div class="group-card-header"><span class="group-dot dot-amber"></span><strong>샵앱</strong></div>
        <p>ShopApp CMS(opstools)용 시각적 도우미입니다. opstools 페이지에서만 작동합니다.</p>
      </div>
      <h3>호환성</h3>
      <p>WPC Hub는 WebExtensions API를 통해 <strong>Chrome</strong>, <strong>Edge</strong>, <strong>Firefox</strong>와 호환됩니다.</p>`,

    setup_content: `
      <p class="section-intro">WPC Hub를 사용하기 전에 설정에서 계정 정보와 API 엔드포인트를 구성하세요. 헤더의 톱니바퀴 아이콘(⚙)을 통해 설정에 접근할 수 있으며, 리포팅 그룹이 활성화된 경우에만 표시됩니다.</p>
      <h3>설정 열기</h3>
      <ol>
        <li>주 탐색 표시줄에서 <strong>Reporting</strong> 탭을 클릭하세요</li>
        <li>헤더 오른쪽 상단의 <strong>톱니바퀴 아이콘(⚙)</strong>을 클릭하세요</li>
        <li>설정 패널이 오른쪽에서 슬라이드됩니다</li>
        <li>정보를 입력하고 <strong>Save Settings</strong>를 클릭하세요</li>
      </ol>
      <h3>계정</h3>
      <div class="field-doc"><div class="field-doc-name">QA Username</div><div class="field-doc-desc">팀 사용자 이름입니다. <strong>Report</strong> 및 <strong>QuickText</strong>의 사용자 이름 필드를 자동으로 채웁니다. QuickText 템플릿의 <code>{user_name}</code> 자리 표시자를 이 값으로 대체합니다.</div></div>
      <div class="field-doc"><div class="field-doc-name">QA ID</div><div class="field-doc-desc">QA 식별자입니다. 체크리스트 파일 이름에 사용됩니다: <code>QA_ID_YYMMDD_template.xlsx</code>.</div></div>
      <h3>Report 모듈</h3>
      <div class="field-doc"><div class="field-doc-name">Apps Script URL</div><div class="field-doc-desc">보고서를 수신하고 Google Sheets에 기록하는 Google Apps Script URL입니다. URL이 없는 경우 팀 리더에게 문의하세요.</div></div>
      <h3>SnapSlide 모듈</h3>
      <div class="field-doc"><div class="field-doc-name">Apps Script URL</div><div class="field-doc-desc">Google Slides에 스크린샷을 삽입하는 Google Apps Script URL입니다.</div></div>
      <div class="field-doc"><div class="field-doc-name">기본 프레젠테이션 ID</div><div class="field-doc-desc">대상 Google Slides 프레젠테이션의 ID입니다. Slides URL에서 찾을 수 있습니다: <code>docs.google.com/presentation/d/<strong>[ID]</strong>/edit</code>.</div></div>`,

    report_content: `
      <p class="section-intro">Report 모듈은 Google Apps Script 엔드포인트를 통해 구조화된 QA 보고서를 Google Sheets로 전송합니다. 각 보고서에는 테스트 결과, 페이지 카테고리, 국가/지역 및 선택적 메모가 포함됩니다.</p>
      <h3>사용 방법</h3>
      <ol>
        <li><strong>Category</strong> 선택 — 테스트 중인 페이지 유형 (예: ShopApp, PDP, HOME)</li>
        <li><strong>Sub</strong> 선택 — 국가/지역 (예: BR, CO, LATIN)</li>
        <li><strong>Status</strong> 선택 — APPROVED, REJECTED, FIXED 또는 PENDING</li>
        <li>선택적으로 <strong>Publisher Error</strong> 및 <strong>Pending Customer</strong> 수를 입력하세요</li>
        <li><strong>QA Username</strong> 입력 (설정에 저장된 경우 자동 입력)</li>
        <li>선택적으로 <strong>Comments</strong> 추가 — <strong>Translate</strong> 버튼으로 PT→EN 자동 번역 가능</li>
        <li><strong>Send Report</strong> 클릭 — 전송 성공 시 팝업이 자동으로 닫힙니다</li>
      </ol>
      <div class="tip-box"><strong>팁:</strong> <strong>Sheets</strong> 버튼을 클릭하면 Google Sheets 로그를 새 탭에서 열 수 있습니다.</div>`,

    checklist_content: `
      <p class="section-intro">Checklist 모듈은 QA ID와 현재 날짜로 자동 이름이 지정된 미리 작성된 Excel(.xlsx) QA 체크리스트 파일을 생성합니다.</p>
      <h3>사용 방법</h3>
      <ol>
        <li><strong>QA ID</strong> 입력 (설정에 저장된 경우 자동 입력) 후 저장 아이콘 클릭</li>
        <li>테스트 중인 페이지 유형에 맞는 <strong>템플릿</strong>을 하나 이상 선택하세요</li>
        <li><strong>Create Checklist</strong>를 클릭하여 파일을 생성하세요</li>
        <li><strong>Download</strong>를 클릭하여 .xlsx 파일을 저장하세요</li>
      </ol>
      <h3>파일 이름 규칙</h3>
      <p>패턴: <code>QA_ID_YYMMDD_템플릿이름.xlsx</code></p>
      <p>예: <code>JD01_260615_Standard.xlsx</code></p>`,

    quicktext_content: `
      <p class="section-intro">QuickText는 미리 작성된 QA 댓글 템플릿을 클릭 한 번으로 복사할 수 있습니다. 버튼을 클릭하면 텍스트가 클립보드에 복사되고 팝업이 자동으로 닫힙니다.</p>
      <h3>사용 방법</h3>
      <ol>
        <li><strong>QA Username</strong> 입력 (설정에 저장된 경우 자동 입력)</li>
        <li>카테고리별로 정리된 템플릿 버튼을 탐색하세요</li>
        <li>템플릿을 클릭하면 텍스트가 즉시 복사됩니다</li>
        <li>티켓 또는 댓글 필드에 텍스트를 붙여 넣으세요</li>
      </ol>
      <h3>사용자 이름 자리 표시자</h3>
      <p>템플릿에 <code>{user_name}</code> 자리 표시자를 포함할 수 있으며, 클릭 시 저장된 QA Username으로 자동 대체됩니다. <strong>설정 → QuickText Templates</strong>에서 모든 템플릿 텍스트를 사용자 지정할 수 있습니다.</p>`,

    screenshot_content: `
      <p class="section-intro">Screenshot 모듈은 활성 브라우저 탭의 현재 뷰포트 스크린샷을 캡처합니다. 캡처한 이미지는 PNG로 다운로드하거나 클립보드에 복사할 수 있습니다.</p>
      <h3>사용 방법</h3>
      <ol>
        <li>캡처할 페이지로 이동하세요</li>
        <li>WPC Hub → <strong>Reporting → Screenshot</strong>을 여세요</li>
        <li><strong>Capture Full Page</strong>를 클릭하세요</li>
        <li>버튼 아래에 스크린샷 미리 보기가 나타납니다</li>
        <li><strong>Download PNG</strong>로 저장하거나 <strong>Copy Image</strong>로 클립보드에 복사하세요</li>
      </ol>`,

    snapslide_content: `
      <p class="section-intro">SnapSlide는 클립보드의 스크린샷을 오류 메타데이터와 함께 Google Apps Script를 통해 Google Slides 프레젠테이션으로 직접 전송합니다.</p>
      <h3>사용 방법</h3>
      <ol>
        <li>OS 스크린샷 도구를 사용하여 페이지 문제의 스크린샷을 캡처하세요</li>
        <li>스크린샷을 클립보드에 복사하세요 (<strong>Ctrl+C</strong>)</li>
        <li>WPC Hub → <strong>Reporting → SnapSlide</strong>를 여세요</li>
        <li><strong>프레젠테이션 ID</strong>를 확인하거나 입력하세요</li>
        <li>캔버스 영역을 클릭한 후 <strong>Ctrl+V</strong>를 눌러 스크린샷을 붙여 넣으세요</li>
        <li><strong>Page Type</strong>을 입력하고 <strong>Error Category</strong>를 선택하세요</li>
        <li><strong>Send to Slides</strong>를 클릭하세요</li>
      </ol>`,

    countryscan_content: `
      <p class="section-intro">콘텐츠 스캔은 활성 페이지를 분석하여 언어, 국가, 스크립트 구성 및 잘못된 국가 CTA 링크와 같은 QA 특정 문제를 감지합니다.</p>
      <h3>사용 방법</h3>
      <ol>
        <li>스캔할 페이지로 이동하세요</li>
        <li>WPC Hub → <strong>QA &amp; 검증 → 콘텐츠 스캔</strong>을 여세요</li>
        <li>선택적으로 <strong>언어</strong>를 수동으로 선택하세요 (기본값: 자동 감지)</li>
        <li><strong>Scan</strong>을 클릭하세요</li>
        <li>결과 검토: 페이지 정보, 감지된 언어, 단어/문자 수, 스크립트 구성</li>
      </ol>
      <h3>QA 도구 (아코디언)</h3>
      <p><strong>QA Tools</strong> 아코디언을 클릭하여 추가 검사를 확장하세요:</p>
      <div class="field-doc"><div class="field-doc-name">Asset Country Check</div><div class="field-doc-desc">이미지 URL을 스캔하고 URL의 국가 코드가 페이지의 예상 국가와 일치하지 않는 에셋을 표시합니다.</div></div>
      <div class="field-doc"><div class="field-doc-name">CTA Country Check</div><div class="field-doc-desc">CTA 링크 URL을 검사하고 예상과 다른 국가 서브도메인을 가리키는 링크를 표시합니다.</div></div>`,

    cta_content: `
      <p class="section-intro">CTA 검사는 통합 페이지 감사 도구입니다. <strong>Scan Page</strong>를 한 번 클릭하면 세 가지 검사가 동시에 실행됩니다: CTA 위반, 링크 target 동작 검증, 페이지의 모든 링크 HTTP 상태 확인 — 모든 결과가 접을 수 있는 아코디언 패널로 정리됩니다.</p>
      <h3>사용 방법</h3>
      <ol>
        <li>감사할 페이지로 이동하세요</li>
        <li>WPC Hub → <strong>QA &amp; 검증 → CTA 검사</strong>를 여세요</li>
        <li><strong>Scan Page</strong>를 클릭하세요</li>
        <li>HTTP 검사가 백그라운드에서 실행되는 동안 진행 표시줄이 나타납니다 — 팝업을 닫고 나중에 돌아올 수 있습니다</li>
        <li>모든 검사가 완료되면 세 개의 결과 패널이 나타납니다 — 위반 항목이 있는 섹션은 자동으로 열립니다</li>
        <li>패널 헤더를 클릭하여 확장하거나 접을 수 있습니다</li>
        <li><strong>Highlight All</strong>로 CTA 및 링크 위반을 페이지에서 색상 테두리로 표시하세요</li>
        <li><strong>Copy Report</strong>로 세 섹션 모두 클립보드로 내보내세요</li>
        <li><strong>Clear results</strong>로 초기화하고 새 스캔을 실행하세요</li>
      </ol>
      <h3>결과 패널</h3>
      <div class="field-doc"><div class="field-doc-name">CTA</div><div class="field-doc-desc">세 가지 위반 유형을 표시합니다: <strong>빈 CTA</strong> — 표시 텍스트가 없는 링크 또는 버튼; <strong>링크 없음</strong> — 유효한 <code>href</code>가 없는 CTA; <strong>공백 포함 URL</strong> — 공백 문자가 포함된 <code>href</code>.</div></div>
      <div class="field-doc"><div class="field-doc-name">Links</div><div class="field-doc-desc"><code>target</code> 속성 동작을 검증합니다. <strong>samsung.com</strong> 링크(서브도메인 및 QA 환경 포함)는 같은 탭에서 열려야 하며, <strong>외부</strong> 링크는 <code>target="_blank"</code>를 사용해야 합니다. 조준선 아이콘(⊕)을 클릭하면 페이지에서 해당 요소로 스크롤됩니다.</div></div>
      <div class="field-doc"><div class="field-doc-name">Check My Links</div><div class="field-doc-desc">페이지의 모든 고유 링크를 가져와 HTTP 문제를 보고합니다: <strong>404 Not Found</strong>, <strong>빈 페이지</strong> (500자 미만 응답), <strong>지역 리다이렉트</strong> (다른 국가로 리다이렉트), <strong>타임아웃</strong> (5초 내 응답 없음), <strong>연결 오류</strong>. 백그라운드에서 실행되며 — 스캔이 완료되면 확장 프로그램 배지에 오류 수가 표시됩니다.</div></div>`,

    links_content: `
      <p class="section-intro">링크 검사는 페이지의 모든 링크의 <code>target</code> 속성 동작을 검증합니다. 내부 도메인 링크는 같은 탭에서, 외부 링크는 새 탭에서 열려야 합니다.</p>
      <h3>규칙</h3>
      <div class="rule-box">
        <div class="rule-row"><span class="rule-badge ok">같은 탭</span><span><code>*.samsung.com</code>으로의 링크(서브도메인 및 QA 환경 포함)는 <code>target="_self"</code>를 사용하거나 target 속성을 생략해야 합니다.</span></div>
        <div class="rule-row"><span class="rule-badge warn">새 탭</span><span>외부 도메인으로의 링크는 <code>target="_blank"</code>를 사용해야 합니다.</span></div>
      </div>
      <h3>사용 방법</h3>
      <ol>
        <li>WPC Hub → <strong>QA &amp; 검증 → 링크 검사</strong>를 여세요</li>
        <li><strong>Audit Links</strong>를 클릭하세요</li>
        <li>요약 카운터를 검토하고 <strong>Highlight</strong>로 위반 링크를 표시하세요</li>
        <li>위반 항목 옆의 화살표(→)를 클릭하면 페이지에서 해당 요소로 스크롤됩니다</li>
      </ol>`,

    overflow_content: `
      <p class="section-intro">텍스트 클리핑은 페이지에서 시각적으로 잘린 단어(컨테이너 오버플로우, 폰트 메트릭 또는 레이아웃 제약으로 인해 단어 중간에 잘린 텍스트)를 감지합니다.</p>
      <h3>사용 방법</h3>
      <ol>
        <li>확인할 페이지로 이동하세요</li>
        <li>WPC Hub → <strong>QA &amp; 검증 → 텍스트 클리핑</strong>을 여세요</li>
        <li><strong>Scan Page</strong>를 클릭하세요</li>
        <li>잘린 텍스트 조각과 CSS 선택자를 보여주는 결과 목록을 검토하세요</li>
        <li><strong>Highlight</strong>로 잘린 요소를 빨간 윤곽선으로 표시하고 <strong>Copy List</strong>로 내보내세요</li>
      </ol>`,

    viewfast_content: `
      <p class="section-intro">모바일 뷰는 현재 페이지를 모바일 크기 뷰포트(390×844 px, iPhone 14)로 표시하는 브라우저 사이드 패널을 엽니다. 도구를 전환하지 않고 반응형 레이아웃을 빠르게 확인할 때 유용합니다.</p>
      <h3>사용 방법</h3>
      <ol>
        <li>미리 보려는 페이지로 이동하세요</li>
        <li>WPC Hub → <strong>QA &amp; 검증 → 모바일 뷰</strong>를 여세요</li>
        <li>팝업이 자동으로 닫히고 브라우저 오른쪽에 <strong>사이드 패널</strong>이 열립니다</li>
        <li>현재 페이지가 모바일 프레임 내에 로드됩니다</li>
        <li>상단 입력 필드에 새 URL을 입력하고 <strong>Enter</strong>를 눌러 이동하세요</li>
      </ol>
      <div class="warn-box"><strong>참고:</strong> <code>X-Frame-Options</code> 또는 <code>Content-Security-Policy</code> 헤더로 보호된 페이지는 프레임 내에서 로드되지 않을 수 있습니다. 이 경우 Chrome DevTools 모바일 에뮬레이션을 사용하세요.</div>`,

    shopapp_content: `
      <p class="section-intro">샵앱은 ShopApp CMS 페이지를 검사하고 디버그하기 위한 시각적 도우미를 제공합니다. 여섯 개의 버튼이 페이지에 직접 시각적 상태를 전환하는 스크립트를 주입합니다.</p>
      <div class="warn-box"><strong>중요:</strong> 샵앱 도구는 <code>opstools-p1-*.ecom-qa.samsung.com</code> 페이지에서만 작동합니다. 다른 URL에서는 효과가 없습니다.</div>
      <h3>사용 가능한 컨트롤</h3>
      <h4>테두리</h4>
      <div class="field-doc"><div class="field-doc-name doc-red">Add Border</div><div class="field-doc-desc">레이아웃 검사 중 경계를 확인할 수 있도록 ShopApp 컴포넌트 주위에 빨간색 시각적 테두리를 추가합니다.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-green">Hide Border</div><div class="field-doc-desc">"Add Border"로 추가된 모든 테두리를 제거합니다.</div></div>
      <h4>제목</h4>
      <div class="field-doc"><div class="field-doc-name doc-amber">Show Titles</div><div class="field-doc-desc">각 ShopApp 블록 위에 컴포넌트 ID 레이블을 주입하여 어떤 블록이 어떤 CMS 항목에 해당하는지 쉽게 식별할 수 있게 합니다.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-blue">Hide Titles</div><div class="field-doc-desc">주입된 컴포넌트 ID 레이블을 제거합니다.</div></div>
      <h4>만료된 항목</h4>
      <div class="field-doc"><div class="field-doc-name doc-purple">Show Expired</div><div class="field-doc-desc">기본적으로 숨겨진 만료된 ShopApp 블록을 표시합니다.</div></div>
      <div class="field-doc"><div class="field-doc-name doc-pink">Hide Expired</div><div class="field-doc-desc">만료된 블록을 다시 숨깁니다.</div></div>`,
  },
};

let currentLang = localStorage.getItem('wpc-docs-lang') || 'en';

function applyLang(lang) {
  if (!T[lang]) return;
  currentLang = lang;
  localStorage.setItem('wpc-docs-lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (T[lang][key] !== undefined) el.innerHTML = T[lang][key];
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  const langAttr = { en: 'en', pt: 'pt-BR', es: 'es', ko: 'ko' };
  document.documentElement.lang = langAttr[lang] || 'en';
  document.title = T[lang].page_title || 'WPC Hub — Documentation';
}

function initTheme() {
  const saved = localStorage.getItem('wpc-docs-theme');
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');

  document.getElementById('docs-theme-toggle').addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('wpc-docs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('wpc-docs-theme', 'light');
    }
  });
}

function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
}

function initScrollSpy() {
  const sections = document.querySelectorAll('.docs-section[id]');
  const links = document.querySelectorAll('.sidebar-link[href^="#"]');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-10% 0px -70% 0px' });

  sections.forEach(s => observer.observe(s));
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLangSwitcher();
  initScrollSpy();
  applyLang(currentLang);
});
