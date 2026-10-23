import type {init_deployments, init_managers} from "@/entry/init/_constant/init";

/**
 * 초기화가 지원하는 배포 대상
 */
type InitDeployment = (typeof init_deployments)[number];

/**
 * 초기화와 생성한 워크플로의 패키지 매니저
 */
export type InitManager = (typeof init_managers)[number];

/**
 * 입력과 기본값 검증을 마친 사이트 초기화 설정
 */
export interface InitOptions {
    /**
     * 사이트 이름
     */
    title: string;
    /**
     * 프로젝트 기준 문서 루트
     */
    content: string;
    /**
     * HTML 문서 언어
     */
    lang: string;
    /**
     * 생성할 호스팅 파일의 종류
     */
    deploy: InitDeployment;
    /**
     * Workers 계정 안의 배포 이름, 다른 호스팅은 없음
     */
    workerName?: string;
    /**
     * GitHub 소유자와 저장소, 미선택 시 없음
     */
    repository?: string;
    /**
     * GitHub 워크플로의 배포 브랜치
     */
    branch: string;
    /**
     * 실행과 설치 명령의 종류
     */
    manager: InitManager;
    /**
     * 확인한 공개 사이트의 도메인
     */
    url?: string;
}

/**
 * 프로젝트 루트 기준으로 생성할 텍스트 파일
 */
export interface InitFile {
    /**
     * 프로젝트 안의 상대 경로
     */
    path: string;
    /**
     * UTF-8 파일 내용
     */
    content: string;
}

/**
 * 생성 계획의 파일과 쓰기 전 원본
 */
export interface InitChange extends InitFile {
    /**
     * 기존 파일의 바이트, 새 파일이면 없음
     */
    previous: Buffer | undefined;
}

/**
 * 검사와 생성 전 확인에 사용하는 파일 변경 계획
 */
export interface InitPlan {
    /**
     * 프로젝트의 절대 경로
     */
    root: string;
    /**
     * 입력 수집을 마친 초기화 설정
     */
    options: InitOptions;
    /**
     * 적용 순서의 텍스트 파일과 원본
     */
    files: InitChange[];
    /**
     * 문서용 빈 폴더를 포함한 상대 경로
     */
    directories: string[];
    /**
     * 초기화 후 의존성 설치 필요 여부
     */
    install: boolean;
}
