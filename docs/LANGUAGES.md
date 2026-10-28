# Adding a language

The card text is written in Greek in the source. A language file maps each Greek string to its translation.
The card uses the Home Assistant language (`auto`) or the `language` option, loads `lang/<code>.js` and falls back to
`en` when no file exists for the language (Greek needs no file).

1. Copy `dist/lang/en.js` to `dist/lang/<code>.js`, for example `de.js` or `pt-BR.js`.
2. In the new file change the code and the name:

   ```js
   (window.__DEEPAL_S05_LANGS = window.__DEEPAL_S05_LANGS || {}).de = {
     "name": "Deutsch",
     "dict": {
       "Κλείδωμα": "Verriegeln",
       "Παράθυρα": "Fenster"
     }
   };
   ```

3. Translate the **values**. Do not change the keys (the Greek text).
4. Keep placeholders such as `{0}` and `{1}` exactly as they are — they are replaced with values, and you may reorder them:
   `"απομένουν {0}": "{0} verbleibend"`.
5. Keep HTML fragments such as `<code>…</code>` in the same places.
6. Run `bash scripts/build.sh` (it syntax-checks every file in `dist/lang/`), reload the browser, choose the language in
   *Settings → General → Language*.

Missing keys are shown in Greek, so a partial translation is fine. Pull requests with new languages are welcome.
