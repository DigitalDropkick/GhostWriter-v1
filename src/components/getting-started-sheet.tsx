export function GettingStartedSheet({ address }: { address?: string }) {
  return (
    <article className="start-sheet mx-auto bg-paper text-ink">
      <header className="start-sheet-head">
        <p className="start-kicker">Ghostwriter · keep this sheet by the computer</p>
        <h1 className="font-serif">You talk. It writes. You read, hear, or print.</h1>
        <p className="start-lead">
          That is the whole program. Your story stays in your voice — your words,
          your humor, the way you tell a thing. Nothing is kept to train anyone
          else’s system.
        </p>
      </header>

      <div className="start-address">
        <p className="start-label">The address of your book</p>
        {address ? (
          <p className="start-url">{address}</p>
        ) : (
          <p className="start-url start-url-blank">
            Adam will write this here, or you copy it from his message.
          </p>
        )}
        <p className="start-hint">
          Open it in <strong>Microsoft Edge</strong> (the blue e) or{" "}
          <strong>Google Chrome</strong>. Pick one. Always use that same program
          — if you switch, it can look like an empty book even though yours is
          still there.
        </p>
      </div>

      <div className="start-split">
        <section>
          <h2>The laptop is home</h2>
          <p>
            Sit at the Windows computer. That is where the book lives, where you
            write, and where you print. Click the star at the top of the window
            so you never have to type the address again.
          </p>
          <p>
            When Windows asks “Use your microphone?”, click <strong>Allow</strong>.
            You only have to do that once.
          </p>
        </section>
        <section>
          <h2>The iPhone is a pocket notebook</h2>
          <p>
            Do not write the book on the phone. If a story arrives away from the
            desk, open <strong>Voice Memos</strong> (the red waveform). Press the
            red circle, talk, press it again.
          </p>
          <p>
            Later, at the laptop: press Talk, then <strong>I have a recording</strong>,
            and choose that memo. Or just sit down and tell it again. Stories keep.
          </p>
        </section>
      </div>

      <section className="start-steps">
        <h2>How to write</h2>
        <ol>
          <li>
            <span>1</span>
            Open your bookmark.
          </li>
          <li>
            <span>2</span>
            The first time, press <strong>Start my book</strong>. Put your name on
            the title page.
          </li>
          <li>
            <span>3</span>
            Press the big green <strong>Talk</strong> button. Tell the memory the
            way you would tell family.
          </li>
          <li>
            <span>4</span>
            Press <strong>I’m finished</strong>. Read what it heard. Fix any word
            that looks wrong — that is normal.
          </li>
          <li>
            <span>5</span>
            Press <strong>Write this into the book</strong>. It will set the page
            in your voice.
          </li>
          <li>
            <span>6</span>
            Whenever you like: <strong>Read</strong> (quiet page),{" "}
            <strong>Listen to the page</strong>, or <strong>Print</strong>.
          </li>
        </ol>
      </section>

      <footer className="start-foot">
        <div>
          <h2>If something looks wrong</h2>
          <ul>
            <li>
              <strong>Wrong words</strong> — fix them before you press Write this
              into the book.
            </li>
            <li>
              <strong>No microphone</strong> — press Type instead, or use a Voice
              Memo from the phone.
            </li>
            <li>
              <strong>Can’t find the book</strong> — same bookmark, same program
              (Edge or Chrome). Don’t use a private or “InPrivate” window.
            </li>
          </ul>
        </div>
        <p className="start-call">
          Anything else — call Adam at <strong>(502) 427-9894</strong>.
        </p>
      </footer>
    </article>
  );
}
