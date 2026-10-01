import {takeWhile} from "es-toolkit/array";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";
import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";
import type {TocGroup, TocSection} from "@/component/widget/shell/_type/toc-group";

/**
 * h2별 h3 수집 · 가름 시작 절에서 목차 묶음 분리
 * 첫 h2 앞의 h3은 목차 제외
 */
export const toTocGroups = (outline: DocOutline): TocGroup[] => {
    const entries = outline.headings
        .filter((heading) => heading.depth === section_heading_depth.section || heading.depth === section_heading_depth.sub)
        .map((heading, index) => ({heading, section: outline.sections[index]}));
    const sections = entries.flatMap((entry, index): TocSection[] =>
        entry.heading.depth === section_heading_depth.section
            ? [
                  {
                      heading: entry.heading,
                      number: entry.section.number,
                      part: entry.section.part,
                      subs: takeWhile(entries.slice(index + 1), (sub) => sub.heading.depth !== section_heading_depth.section).map((sub) => ({
                          heading: sub.heading,
                          number: sub.section.number,
                      })),
                  },
              ]
            : [],
    );

    return sections.flatMap((section, index) =>
        index === 0 || section.part !== undefined
            ? [
                  {
                      part: section.part,
                      sections: [section, ...takeWhile(sections.slice(index + 1), (next) => next.part === undefined)],
                  },
              ]
            : [],
    );
};
