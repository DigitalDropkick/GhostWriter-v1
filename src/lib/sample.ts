import type { Book, Chapter } from "./types";

export const SAMPLE_BOOK_ID = "sample-book";
export const SAMPLE_CHAPTER_ID = "sample-ch-1";

export const SAMPLE_BODY = `I never set out to write a book. I set out to remember.

The porch faced west, which meant the last of the day always landed in our laps. My father would come in from the field with dust on his boots and sit in the same chair, the one that complained when you leaned back. He didn't talk much until the light got long. Then, as if the day had finally given him permission, he would start.

He told the same three stories. I used to think that was a failing. Now I think it was the point. You tell a thing until the people who love you can tell it for you.

The first was the river. He was ten. The water came up in the night and took the lower pasture, and in the morning there was a rowboat in the locust tree, hanging there like someone had parked it. He climbed up and sat in it, just to say he had. His mother called him a fool and then packed him a biscuit so he wouldn't starve in the branches. He told it as a joke. I think it was the proudest he ever was of being a child.

The second was the war, and he never told it all the way through. He would get as far as the smell of the canvas, or the way the letters came, and then he would look at his hands and change the subject to the garden. We learned not to push. Some stories are a door you leave closed out of respect.

The third was my mother. How he saw her at a church supper with a plate of sliced tomatoes and decided, without asking anyone, that he was going to marry her. He was wrong about a great many things in his life. He was not wrong about that.

I am sitting here now, older than he was when he told me these things, and I can still hear the chair. That is what I want on the page. Not a history. The chair. The light. The way a man will finally talk when the day is almost over.

If I wander, that is all right. A life is not a straight road. You just keep talking, and someone kind enough to listen puts the words where they belong.`;

export function makeSampleBook(now = Date.now()): {
  book: Book;
  chapter: Chapter;
} {
  return {
    book: {
      id: SAMPLE_BOOK_ID,
      title: "The West Porch",
      author: "A storyteller",
      kind: "memoir",
      polish: "literary",
      voiceNotes:
        "Warm, unhurried, Southern-leaning American English. Short sentences mixed with longer remembering ones. Does not show off.",
      isSample: true,
      createdAt: now,
      updatedAt: now,
    },
    chapter: {
      id: SAMPLE_CHAPTER_ID,
      bookId: SAMPLE_BOOK_ID,
      title: "The Chair That Complained",
      body: SAMPLE_BODY,
      sort: 0,
      updatedAt: now,
    },
  };
}
