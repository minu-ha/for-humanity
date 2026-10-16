import {takeWhile} from "es-toolkit/array";
import type {TocGroup, TocSection} from "@/component/widget/navigation/_type/toc-group";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";
import type {DocOutline} from "@/type/doc-outline";

/**
 * h2별 h3 수집. 가름 시작 절에서 목차 묶음 분리
 *
 *   - 첫 h2 앞의 h3은 목차 제외
 */
export const toTocGroups = (outline: DocOutline): TocGroup[] => {
    const entries = outline.headings
        .filter((heading) => heading.depth === section_heading_depth.section || heading.depth === section_heading_depth.sub)
        .map((heading, index) => ({heading, section: outline.sections[index]}));

    const sections = entries.flatMap((entry, index): TocSection[] => {
        if (entry.heading.depth !== section_heading_depth.section) {
            return [];
        }

        return [
            {
                heading: entry.heading,
                part: entry.section.part,
                subs: takeWhile(entries.slice(index + 1), (sub) => sub.heading.depth !== section_heading_depth.section).map((sub) => {
                    return {heading: sub.heading};
                }),
            },
        ];
    });

    return sections.flatMap((section, index) => {
        if (index > 0 && section.part === undefined) {
            return [];
        }

        return [
            {
                part: section.part,
                sections: [section, ...takeWhile(sections.slice(index + 1), (next) => next.part === undefined)],
            },
        ];
    });
};
