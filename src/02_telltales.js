
/* ───────────────────────── Ενδεικτικές λυχνίες (telltales) ─────────────────────────
 * Γεμάτα εικονογράμματα σε πλέγμα 32×32, σχεδιασμένα όπως οι λυχνίες του ταμπλό
 * (ISO 2575): airbag, ABS, φρένα, υγρά, μπαταρίες, τιμόνι, ελαστικό, κινητήρας κ.ά.
 * Χρώμα = currentColor (πράσινο / κεχριμπάρι / κόκκινο / γκρι ανάλογα με την κατάσταση).
 * s = γραμμή, χωρίς class = γεμάτο σχήμα. Οι «κοπές» γίνονται με mask. */
const TT_M = (id, shapes) => `<mask id="tm-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32"><rect width="32" height="32" fill="#fff"/>${shapes}</mask>`;
const TT_BANG = (x, y, h = 5.2, r = 1.4) => `<path class="s" d="M${x} ${y}v${h}"/><circle cx="${x}" cy="${y + h + 3.2}" r="${r}"/>`;
const TT = {
  /* φρένα: (!) μέσα σε παρενθέσεις */
  brake: `<circle class="s" cx="16" cy="16" r="7.6"/>${TT_BANG(16, 11.4, 4.6)}
    <path class="s" d="M7.2 9.4Q3 16 7.2 22.6M24.8 9.4Q29 16 24.8 22.6"/>`,
  /* υγρά φρένων: σταγόνα με ! */
  fluid: `${TT_M("fl", '<rect x="14.8" y="12" width="2.4" height="7.2" rx="1.2" fill="#000"/><circle cx="16" cy="22.4" r="1.5" fill="#000"/>')}
    <path mask="url(#tm-fl)" d="M16 3.6c5.2 5.8 8.4 9.8 8.4 14a8.4 8.4 0 0 1-16.8 0c0-4.2 3.2-8.2 8.4-14z"/>`,
  /* μπαταρία 12V */
  battery12: `<path class="s" d="M5.2 11.6h21.6a1.6 1.6 0 0 1 1.6 1.6v11.2a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V13.2a1.6 1.6 0 0 1 1.6-1.6z"/>
    <rect x="7" y="7.6" width="5.2" height="4" rx=".9"/><rect x="19.8" y="7.6" width="5.2" height="4" rx=".9"/>
    <path class="s" d="M8 18.6h5.4M10.7 15.9v5.4M18.8 18.6h5.4"/>`,
  /* μπαταρία έλξης χαμηλή */
  battery: `<rect class="s" x="3.4" y="9.6" width="22.6" height="12.8" rx="3"/><rect x="27.4" y="13.6" width="2.2" height="4.8" rx="1"/>
    <rect x="6.4" y="12.6" width="4.4" height="6.8" rx="1.2"/>${TT_BANG(18.6, 12.6, 3.8, 1.2)}`,
  /* σύστημα ισχύος: αυτοκίνητο με κεραυνό */
  evfault: `${TT_M("ev", '<circle cx="8.6" cy="22.4" r="4" fill="#000"/><circle cx="23.4" cy="22.4" r="4" fill="#000"/><path d="M17.6 10.6l-4.6 6.2h3.4l-1.4 5.2 5.6-7.2h-3.6z" fill="#000"/>')}
    <path mask="url(#tm-ev)" d="M2.6 22.4v-4.6c0-1 .6-1.9 1.6-2.2l3.8-1.3 2.7-4.1c.4-.7 1.2-1.1 2-1.1h6.4c.8 0 1.5.4 2 1l3.1 4.1 2.2.7c1 .3 1.7 1.2 1.7 2.3v5.2z"/>
    <circle cx="8.6" cy="22.6" r="2.6"/><circle cx="23.4" cy="22.6" r="2.6"/>`,
  /* περιορισμός ισχύος: χελώνα */
  turtle: `${TT_M("tu", '<path d="M16.4 12.4v9.2M10.8 15.4l2.8 6.2M22 15.4l-2.8 6.2M8.6 18.6h14.8" stroke="#000" stroke-width="1.5" stroke-linecap="round" fill="none"/>')}
    <path mask="url(#tm-tu)" d="M5.8 22.4c0-6.2 4.6-10.6 10.6-10.6s10.6 4.4 10.6 10.6z"/>
    <path d="M26.4 17.4c1.3-1.8 3.7-1.9 4.5-.3.6 1.3-.1 3-1.5 3.5l-3.2 1z"/>
    <path d="M9.2 22.4v3.6h3.6v-3.6M20.4 22.4v3.6H24v-3.6"/><path class="s" stroke-width="1.8" d="M6 21.4 3 23.6"/>`,
  /* υποβοήθηση τιμονιού: τιμόνι με ! */
  steering: `<circle class="s" cx="16" cy="15" r="11.2" stroke-width="2.6"/>
    <path class="s" stroke-width="3" d="M5.2 12.8Q16 17 26.8 12.8"/><circle cx="16" cy="15" r="2.2"/>
    <path class="s" stroke-width="2.3" d="M16 19.4v3.4"/><circle cx="16" cy="25.2" r="1.25"/>`,
  /* πίεση ελαστικών: τομή ελαστικού με ! */
  tirealert: `<path class="s" stroke-width="2.4" d="M9.2 7.6A10.4 10.4 0 0 0 5.2 16c0 3.2 1.3 6 3.3 8 .5.5 1.2.8 1.9.8h11.2c.7 0 1.4-.3 1.9-.8 2-2 3.3-4.8 3.3-8 0-3.3-1.5-6.3-4-8.4"/>
    <path class="s" stroke-width="2" d="M9.6 28.4l1.3-2 1.5 2 1.5-2 1.5 2 1.5-2 1.5 2 1.5-2 1.5 2"/>${TT_BANG(16, 11.2, 5)}`,
  /* μπαταρία κλειδιού */
  key: `<rect class="s" x="4.4" y="4.8" width="14.4" height="22.4" rx="5.6"/><circle class="s" cx="11.6" cy="9.8" r="2"/>
    <circle cx="11.6" cy="15.6" r="1.6"/><circle cx="8.2" cy="19.4" r="1.5"/><circle cx="15" cy="19.4" r="1.5"/><circle cx="11.6" cy="23" r="1.5"/>
    <rect class="s" x="21.4" y="17.6" width="7.4" height="10" rx="1.6" stroke-width="1.9"/><rect x="23.4" y="15.8" width="3.4" height="2" rx=".6"/><rect x="23.2" y="23.4" width="3.8" height="2.8" rx=".5"/>`,
  /* κινητήρας (check engine) */
  engine: `<path class="s" stroke-width="2.2" d="M13 8.2h6M16 8.2v3"/>
    <path class="s" stroke-width="2.2" d="M9.8 11.4h12.4l2.2 2.6h2.4v3.2h1.9v5.6h-1.9v2.6h-4.1l-1.7 2H11.2l-2.6-2.8V11.4z"/>
    <path class="s" stroke-width="2.2" d="M9.8 15.2H5.6v7.4h3"/><path class="s" stroke-width="1.8" d="M13.6 17.4h5.2M13.6 21h5.2"/>`,
  /* πορτμπαγκάζ ανοιχτό */
  trunk: `${TT_M("tk", '<path d="M12.2 5.6h7.6l1 4.2H11.2z" fill="#000"/><rect x="5.8" y="18.6" width="5.6" height="2.6" rx="1.1" fill="#000"/><rect x="20.6" y="18.6" width="5.6" height="2.6" rx="1.1" fill="#000"/><rect x="13.2" y="19" width="5.6" height="2.6" rx="1" fill="#000"/>')}
    <g mask="url(#tm-tk)"><path d="M7.4 11.8 10.2 3.8c.2-.6.7-1 1.4-1h8.8c.7 0 1.2.4 1.4 1l2.8 8z"/><rect x="3.2" y="14.4" width="25.6" height="10" rx="3.6"/></g>
    <rect x="5.6" y="24.2" width="5" height="3.6" rx="1.2"/><rect x="21.4" y="24.2" width="5" height="3.6" rx="1.2"/>`,
    /* πίεση / στάθμη λαδιού */
  oil: `<path d="M3.2 12.6l3.6 1.3v-2.4H5.2V9.7h7.8v1.8h-1.6v1.6h5.6l6.6-3 1.3 2.5-6.2 3v7.5c0 1.2-1 2.2-2.2 2.2H9c-1.2 0-2.2-1-2.2-2.2v-2.4L3.2 18.2z"/><path d="M27.6 15.6c1.4 1.8 2.2 3 2.2 4.2a2.2 2.2 0 0 1-4.4 0c0-1.2.8-2.4 2.2-4.2z"/>`,
  /* παράθυρο πάνω / κάτω */
  window: `<path class="s" stroke-width="2.2" d="M5 27V12.6L9.4 6.2c.4-.6 1-.9 1.7-.9H25c1 0 1.8.8 1.8 1.8V27z"/>
    <path class="s" stroke-width="2" d="M5 14.4h8.2"/>
    <path d="M18.6 11.8l-3.4 4.4h6.8zM18.6 24.2l-3.4-4.4h6.8z"/>`,
};
const tt = (n, cls = "") => `<svg class="tt ${cls}" viewBox="0 0 32 32" aria-hidden="true">${TT[n]}</svg>`;
