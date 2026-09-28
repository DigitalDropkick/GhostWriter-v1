export function GettingStartedSheet() {
  return (
    <article className="start-sheet mx-auto bg-paper text-ink">
      <header className="start-sheet-head">
        <p className="start-kicker">Ghostwriter · Digital Dropkick</p>
        <h1 className="font-serif">Your story, in your words.</h1>
        <p className="start-lead">
          A quiet place to talk, type, read, listen, and print. Your books and recordings stay on
          the device where you write.
        </p>
      </header>
      <div className="start-address">
        <p className="start-label">Make yourself at home</p>
        <p className="start-hint">
          Open the address Addam gave you and sign in with your approved email. On Windows, use
          Chrome or Edge. On iPhone, use Safari. Keep using the same browser or installed
          Ghostwriter icon to find your books.
        </p>
      </div>
      <section className="start-steps">
        <h2>From a memory to a page</h2>
        <ol>
          <li>
            <span>1</span>
            <div>
              Choose <strong>Start my book</strong> and add your name and title. Returning? Your
              last book opens for you.
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              Choose <strong>Talk</strong>, then <strong>Start private dictation</strong>. Allow the
              microphone. Or choose <strong>Type instead</strong>.
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              Keep Ghostwriter open while recording. Choose <strong>I’m finished</strong>, then read
              and correct the words.
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              Choose <strong>Write this into the book</strong>. Wait for{" "}
              <strong>Saved on this device</strong> before closing.
            </div>
          </li>
          <li>
            <span>5</span>
            <div>
              Choose <strong>Keep draft for later</strong> if you are not finished. Next time,
              choose <strong>Continue my draft</strong>.
            </div>
          </li>
          <li>
            <span>6</span>
            <div>
              Use <strong>Read</strong>, <strong>Listen to the page</strong>, or{" "}
              <strong>Print</strong>. Listening needs an English voice installed on your device.
            </div>
          </li>
        </ol>
      </section>
      <div className="start-split">
        <section>
          <h2>Install it. Take it offline.</h2>
          <p>
            Open <strong>Install Ghostwriter</strong> in the writing room. On Windows, use your
            browser’s install option. On iPhone, choose <strong>Share → Add to Home Screen</strong>.
          </p>
          <p>
            Open the new icon while online. Wait for offline readiness. Choose{" "}
            <strong>Prepare offline dictation</strong>, then try a short recording. The first speech
            download needs internet; your audio stays here.
          </p>
        </section>
        <section>
          <h2>Keep a separate copy.</h2>
          <p>
            After writing, open <strong>Backups</strong> (or <strong>Keep safe</strong> on a phone).
            Download a backup or save it to Files. Check that the file is there.
          </p>
          <p>
            To restore, choose that backup and <strong>Restore these books</strong>. It adds copies
            without replacing your current books. Use this to move between devices; books do not
            automatically sync.
          </p>
        </section>
      </div>
      <footer className="start-foot">
        <div>
          <h2>If something interrupts you</h2>
          <ul>
            <li>
              <strong>Not saved?</strong> Keep the page open. Download a backup of your latest
              words, then follow the save message.
            </li>
            <li>
              <strong>Recording interrupted?</strong> Reopen your draft. Save the recording and
              retry turning it into words. Only audio already saved can be recovered.
            </li>
            <li>
              <strong>Book missing?</strong> Check the same device, address, browser, and Books
              list. Avoid private browsing. Do not clear website data or delete the app.
            </li>
          </ul>
        </div>
        <p className="start-call">
          Need a hand? Digital Dropkick · <strong>(502) 427-9894</strong>
        </p>
      </footer>
    </article>
  );
}
