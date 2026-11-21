const PIPER = {
  store: 'piper-v1', id: null, ready: null, src: null, live: null,
  urls(id) {
    const C = ABC.config.piper, [loc, name, q] = id.split('-'), model = `${C.models}/${loc.split('_')[0]}/${loc}/${name}/${q}/${id}.onnx`;
    return { ort: `${C.ort}ort.wasm.min.js`, ortWasm: `${C.ort}ort-wasm-simd.wasm`, ph: `${C.phonemize}piper_phonemize.js`,
      phWasm: `${C.phonemize}piper_phonemize.wasm`, phData: `${C.phonemize}piper_phonemize.data`, cfg: `${model}.json`, model };
  },
  ok: () => 'caches' in window && 'BigInt64Array' in window,
  async has(id) {
    if (!id || !this.ok()) return false;
    const c = await caches.open(this.store);
    return (await Promise.all(Object.values(this.urls(id)).map(u => c.match(u)))).every(Boolean);
  },
  async size(id) {
    const c = await caches.open(this.store), u = this.urls(id), run = [u.ort, u.ortWasm, u.ph, u.phWasm, u.phData];
    const own = await Promise.all([u.cfg, u.model].map(async x => (await c.match(x)) ? 0
      : fetch(x, { headers: { Range: 'bytes=0-0' } }).then(r => +((r.headers.get('content-range') || '').split('/')[1]) || 0).catch(() => 0)));
    const needRun = (await Promise.all(run.map(x => c.match(x)))).some(r => !r);
    return own.reduce((a, b) => a + b, 0) + (needRun ? ABC.config.piper.runtime : 0);
  },
  async download(id, progress, signal) {
    const c = await caches.open(this.store), total = await this.size(id) || 1;
    let got = 0;
    for (const u of Object.values(this.urls(id))) {
      if (await c.match(u)) continue;
      const r = await fetch(u, { signal });
      if (!r.ok) throw new Error(`${r.status}`);
      const rd = r.body.getReader(), parts = [];
      for (;;) {
        const { done, value } = await rd.read();
        if (done) break;
        parts.push(value); got += value.length; if (progress) progress(Math.min(1, got / total));
      }
      await c.put(u, new Response(new Blob(parts), { headers: { 'content-type': r.headers.get('content-type') || 'application/octet-stream' } }));
    }
  },
  async remove(id) {
    const c = await caches.open(this.store), u = this.urls(id);
    await Promise.all([u.model, u.cfg].map(x => c.delete(x)));
    if (this.id === id) { this.id = null; this.ready = null; this.live = null; }
  },
  async blob(u) { return URL.createObjectURL(await (await (await caches.open(this.store)).match(u)).blob()); },
  script: src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }),
  load(id) {
    if (this.id === id && this.ready) return this.ready;
    this.id = id;
    this.ready = (async () => {
      const u = this.urls(id), c = await caches.open(this.store);
      if (!self.ort) await this.script(await this.blob(u.ort));
      if (!self.createPiperPhonemize) await this.script(await this.blob(u.ph));
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = { 'ort-wasm-simd.wasm': await this.blob(u.ortWasm) };
      const files = { wasm: await this.blob(u.phWasm), data: await this.blob(u.phData) };
      const cfg = await (await c.match(u.cfg)).json();
      const sess = await ort.InferenceSession.create(await (await c.match(u.model)).arrayBuffer(), { executionProviders: ['wasm'] });
      return { cfg, sess, files };
    })();
    this.ready.catch(() => { this.id = null; this.ready = null; });
    return this.ready;
  },
  async textIds(text) {
    const { cfg, files } = await this.ready;
    return new Promise((res, rej) => createPiperPhonemize({
      print: d => res(JSON.parse(d).phoneme_ids), printErr: () => {},
      locateFile: f => f.endsWith('.wasm') ? files.wasm : f.endsWith('.data') ? files.data : f
    }).then(m => m.callMain(['-l', cfg.espeak.voice, '--input', JSON.stringify([{ text }]), '--espeak_data', '/espeak-ng-data'])).catch(rej));
  },
  async ipaIds(ipa) {
    const { cfg } = await this.ready, map = cfg.phoneme_id_map, one = c => map[c] ? map[c][0] : null;
    const chars = [...ipa.replace(/[/[\].]/g, '').replace(/͡/g, '').replace(/ʧ/g, 'tʃ').replace(/ʤ/g, 'dʒ').replace(/ʦ/g, 'ts').normalize('NFD')];
    return [one('^'), one('_'), ...chars.flatMap(c => one(c) == null ? [] : [one(c), one('_')]), one('$')];
  },
  async pcm(ids) {
    const { cfg, sess } = await this.ready, I = cfg.inference;
    const out = await sess.run({ input: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
      input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)])),
      scales: new ort.Tensor('float32', Float32Array.from([I.noise_scale, I.length_scale / SPEECH.rate, I.noise_w])) });
    return out.output.data;
  },
  async render(text, phonemes) {
    const parts = [];
    if (phonemes) {
      let at = 0;
      phonemes.re.lastIndex = 0;
      for (const m of text.matchAll(phonemes.re)) {
        if (m.index > at) parts.push({ t: text.slice(at, m.index) });
        parts.push({ ipa: phonemes.map.get(m[0].toLocaleLowerCase(SPEECH.bcp47)) });
        at = m.index + m[0].length;
      }
      phonemes.re.lastIndex = 0;
      if (at < text.length) parts.push({ t: text.slice(at) });
    } else parts.push({ t: text });
    const pcms = [];
    for (const p of parts) {
      if (p.t != null && !/[\p{L}\p{N}]/u.test(p.t)) continue;
      pcms.push(await this.pcm(p.ipa ? await this.ipaIds(p.ipa) : await this.textIds(p.t)));
    }
    const all = new Float32Array(pcms.reduce((n, x) => n + x.length, 0));
    pcms.reduce((at, x) => { all.set(x, at); return at + x.length; }, 0);
    return { data: all, rate: (await this.ready).cfg.audio.sample_rate };
  },
  engine(id) {
    return {
      uri: `piper:${id}`,
      say: async text => {
        const { data, rate } = await PIPER.render(text, SPEECH.phonemes);
        await PIPER.play(data, rate);
      },
      stop: () => PIPER.stop()
    };
  },
  async play(data, rate) {
    ensureAudio();
    if (!AC || !data.length) return;
    const b = AC.createBuffer(1, data.length, rate);
    b.copyToChannel(data, 0);
    this.stop();
    const s = this.src = AC.createBufferSource();
    s.buffer = b; s.connect(AC.destination);
    await new Promise(res => { s.onended = res; s.start(); });
  },
  stop() { if (this.src) { try { this.src.stop(); } catch (e) {} this.src = null; } }
};
