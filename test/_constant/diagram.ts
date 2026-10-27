/**
 * 공식 렌더러의 서로 다른 문법과 작성자 설정
 */
export const diagram_cases = [
    {
        caseId: "MRM-001",
        id: "flowchart",
        name: "흐름도",
        label: "한글 작성",
        source: 'flowchart LR\n    a("한글 작성<br>문서") -->|확인| b("배포")\n    click a "https://example.com" "Tooltip text"',
    },
    {
        caseId: "MRM-002",
        id: "sequence",
        name: "시퀀스",
        label: "Reader",
        source: "sequenceDiagram\n    participant Reader\n    participant Docs\n    Reader->>Docs: Read\n    Docs-->>Reader: Content",
    },
    {caseId: "MRM-003", id: "state", name: "상태도", label: "Published", source: "stateDiagram-v2\n    [*] --> Draft\n    Draft --> Published\n    Published --> [*]"},
    {caseId: "MRM-004", id: "er", name: "개체 관계도", label: "title", source: "erDiagram\n    SHELF ||--o{ BOOK : contains\n    BOOK {\n        string title\n    }"},
    {caseId: "MRM-005", id: "tree", name: "파일 트리", label: "sample.svg", source: "treeView-beta\ndocs/\n├── README.md\n└── images/\n    └── sample.svg"},
    {caseId: "MRM-006", id: "mindmap", name: "마인드맵", label: "Documentation", source: "mindmap\n  root((Documentation))\n    Guide\n    Reference"},
    {caseId: "MRM-007", id: "pie", name: "원형 차트", label: "Readers", source: 'pie title Readers\n    "Guide" : 60\n    "Reference" : 40'},
    {caseId: "MRM-008", id: "authored", name: "작성자 테마", label: "Custom", source: "---\nconfig:\n  theme: neutral\n---\nflowchart LR\n    Custom --> Theme"},
    {caseId: "MRM-027", id: "wide", name: "긴 라벨", label: "공통 모듈: 설정과 동조 방식", source: 'flowchart LR\n    a["공통 모듈: 설정과 동조 방식"] --> b["끝"]'},
];
