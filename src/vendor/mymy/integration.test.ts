import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MymyX } from "./Apps";
import { SocialDetail } from "../../skins/SocialDetails";
import { commentCount, repostCount } from "../../skins/socialMetrics";
import { compileStory } from "../../story-engine/compiler";
import { testStory } from "../../story-engine/testStory";
import { dispatch } from "../../engine";
import { initialRuntime, makeItem } from "../../schema";
import fixture from "../../../tests/fixtures/mymy-ui/story.json";
describe("Mymy adapters preserve shared story engine", () => {
  it("compiles authored KKT and verifies read → call → Instagram unlock", () => {
    const { story, work } = compileStory(fixture);
    expect(testStory(story, work)).toEqual([]);
    let state = dispatch(work, initialRuntime(work), "read", "kkt-last");
    expect(state.incomingCall?.target).toBe("test-call");
    state = dispatch(work, state, "callAnswered", "test-call");
    state = dispatch(work, state, "callEnded", "test-call");
    expect(state.unlocked).toContain("ig-after-call");
  });
});

describe("X authored identity and dates", () => {
  const avatar =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const props = {
    name: "X",
    creator: false,
    thread: "",
    onRead() {},
    onItem() {},
    onAdd() {},
    onBack() {},
    onThread() {},
  };

  it("shows historical metrics without inventing replies or missing views", () => {
    const item = makeItem({
      id: "historical-post",
      title: "历史推文",
      time: "2022/8/8",
      likes: 19000,
      meta: { commentCount: "429", reposts: "1292", views: "" },
    });
    const feed = renderToStaticMarkup(
      createElement(MymyX, { ...props, items: [item] }),
    );
    expect(feed).toMatch(/aria-label="评论历史推文"[\s\S]*?429<\/button>/);
    expect(feed).toMatch(/aria-label="转发历史推文"[\s\S]*?1292<\/button>/);
    expect(feed).toContain("1.9万");
    expect(feed).not.toContain("lucide-chart-no-axes-column-increasing");
    const detail = renderToStaticMarkup(
      createElement(SocialDetail, {
        app: "twitter",
        item,
        owner: "机主",
        back() {},
      }),
    );
    expect(detail).toContain("未收录评论内容");
    expect(detail).not.toContain("次查看");
    expect(item.comments).toEqual([]);
    expect(commentCount(item, 1)).toBe(430);
    expect(repostCount(item)).toBe(1292);
  });

  it("shows supplied views and adds saved player interactions to historical totals", () => {
    const item = makeItem({
      id: "viewed-post",
      likes: 1673,
      meta: { commentCount: "81", reposts: "62", views: "52万" },
    });
    const ui = {
      "liked-viewed-post": true,
      "replies-viewed-post": ["机主：支持"],
      mymyXReposts: [item.id],
    };
    const feed = renderToStaticMarkup(
      createElement(MymyX, { ...props, items: [item], ui }),
    );
    const detail = renderToStaticMarkup(
      createElement(SocialDetail, {
        app: "twitter",
        item,
        owner: "机主",
        ui,
        back() {},
      }),
    );
    for (const html of [feed, detail]) {
      expect(html).toContain("52万");
      expect(html).toMatch(/82<\/button>/);
      expect(html).toMatch(/63<\/button>/);
      expect(html).toContain("1674");
    }
  });

  it.each(["2022/8/8", "2022-08-08"])(
    "preserves full date %s and the authored avatar in the feed and detail",
    (time) => {
      const item = makeItem({
        sender: "EDG Zmjjkk",
        body: "first line\nsecond line",
        time,
        avatar,
        meta: { handle: "zmjjkk" },
      });
      const feed = renderToStaticMarkup(
        createElement(MymyX, { ...props, items: [item] }),
      );
      expect(feed).toContain(time.replace(/-/g, "/"));
      expect(feed).toContain("@zmjjkk");
      expect(feed).toContain(avatar);
      expect(feed).toContain(item.body);
      const detail = renderToStaticMarkup(
        createElement(SocialDetail, {
          app: "twitter",
          item,
          owner: "机主",
          back() {},
        }),
      );
      expect(detail).toContain("@zmjjkk");
      expect(detail).toContain(avatar);
      expect(detail).toContain(time);
    },
  );

  it("keeps timestamp display and avoids a duplicate @ on prefixed handles", () => {
    const item = makeItem({
      time: "2024-08-24 16:30",
      meta: { handle: "@zmjjkk" },
    });
    const feed = renderToStaticMarkup(
      createElement(MymyX, { ...props, items: [item] }),
    );
    expect(feed).toContain("16:30");
    expect(feed).toContain("@zmjjkk");
    expect(feed).not.toContain("@@zmjjkk");
  });
});
