---
name: Figures
label: 단계, 슬라이더, 실행 코드가 있는 인터랙티브 그림
group: Guide
parent: writing
order: 16
---

인터랙티브 그림은 `<figure class="fx">` 상자 안에 원시 HTML로 쓰고 종류를 `data-fx`로 적습니다. 조작부, 형광펜, 전환은 브라우저에서 사이트가 더하며, JavaScript가 없으면 끝까지 가는 요소와 모든 설명이 보입니다.
순서와 상태 변화, 같은 전이의 나란한 비교, 슬라이더에 따라 바뀌는 값, 코드를 실행해 확인하는 예측에 맞습니다. 정적인 구조는 [이미지](images.md)나 [다이어그램](diagrams.md)으로 둡니다.

`0.28.0`부터 지원합니다.

## Overview

| 종류 | `data-fx` | 사이트가 더하는 것 |
| --- | --- | --- |
| 단계 | `steps` | 재생, 이전, 다음, 스크러버, `n / N`이 있는 띠. 단계마다 보이고 칠해지고 움직이는 요소. 한 번에 설명 하나 |
| 탭 | `data-labels`를 준 `steps` | 재생 띠 대신 탭 버튼 |
| 슬라이더 | `range` | `--fx-v`로 주는 비율, `data-value`로 주는 값, `<output>` 글자, `fx:input` 이벤트 |
| 실행 상자 | `run` | 바로 위 코드 블록을 샌드박스에서 실행하고 콘솔을 보이는 버튼 |
| 직접 그리기 | `custom` | 아이콘 버튼만. 장면은 `<script type="module">`이 그립니다 |

HTML 블록 안에는 빈 줄을 두지 않습니다. 빈 줄에서 블록이 끝나고 다시 Markdown으로 해석합니다.
그림마다 무엇을 보여 주는지 `aria-label`로 적고 그림의 핵심은 본문에도 씁니다.

## Steps

장면의 요소에 단계 범위를 적습니다. `data-on`은 그 단계에만 요소를 보이고 `data-hl`은 그 단계에 형광펜을 칠하며 `data-pos`는 그 단계부터 요소를 정한 위치로 옮깁니다.
범위는 `3`, `2-5`, `4-`(끝까지), `-2`(처음부터)로 적고 여러 범위는 공백으로 잇습니다. 위치는 픽셀 단위의 `단계:x y`로 적고 여러 위치는 단계 순서대로 `;`로 잇습니다.
`data-steps`가 단계 수를 정합니다. 없으면 `<ol class="fx__captions">`의 항목 수를 씁니다. 설명은 단계마다 하나씩 보입니다. `data-steps`도 설명도 없는 단계 그림에는 띠가 붙지 않습니다.
숨긴 요소도 배치 안의 자리는 차지합니다. 한 자리에 다른 요소를 번갈아 보이려면 `fx-swap` 상자에 넣습니다.

### Source

```html
<figure class="fx" data-fx="steps" aria-label="요청이 캐시를 지나는 과정">
<div class="fx__stage">
<div class="fx-row">
<span class="fx-chip" data-on="-2">요청</span>
<span class="fx-chip" data-hl="2">캐시</span>
<span class="fx-chip fx-chip--mine" data-on="3-">응답</span>
<span class="fx-chip" data-pos="1:0 0;3:24 0">3단계에서 오른쪽으로</span>
</div>
</div>
<ol class="fx__captions">
<li>요청이 브라우저를 떠납니다.</li>
<li>캐시를 확인합니다.</li>
<li>응답이 돌아옵니다.</li>
</ol>
</figure>
```

### Result

<figure class="fx" data-fx="steps" aria-label="요청이 캐시를 지나는 과정">
<div class="fx__stage">
<div class="fx-row">
<span class="fx-chip" data-on="-2">요청</span>
<span class="fx-chip" data-hl="2">캐시</span>
<span class="fx-chip fx-chip--mine" data-on="3-">응답</span>
<span class="fx-chip" data-pos="1:0 0;3:24 0">3단계에서 오른쪽으로</span>
</div>
</div>
<ol class="fx__captions">
<li>요청이 브라우저를 떠납니다.</li>
<li>캐시를 확인합니다.</li>
<li>응답이 돌아옵니다.</li>
</ol>
</figure>

재생은 단계마다 2초 머물고 첫 전환만 누른 뒤 0.5초에 합니다. 화면에 있던 장면은 이미 읽었기 때문입니다. 마지막 단계에서 재생을 누르면 1단계부터 다시 시작합니다.
포커스가 그림 안에 있으면 좌우 방향키로도 한 단계씩 넘깁니다. 이전과 다음 버튼은 양 끝에서도 포커스를 받을 수 있고 그때는 `aria-disabled`로 표시합니다.

### Tabs

`data-labels`를 주면 띠에 재생, 이전, 다음, 스크러버, 단계 수 대신 라벨마다 탭 하나를 보입니다. 라벨은 `|`로 나눕니다. 설명 목록이 없으면 `data-steps`로 단계 수를 적습니다.

```html
<figure class="fx" data-fx="steps" data-labels="전|후" data-steps="2" aria-label="바꾸기 전과 후">
<div class="fx__stage">
<div class="fx-swap">
<p data-on="1">전: 페이지마다 요청 하나.</p>
<p data-on="2">후: 세션마다 요청 하나.</p>
</div>
</div>
</figure>
```

<figure class="fx" data-fx="steps" data-labels="전|후" data-steps="2" aria-label="바꾸기 전과 후">
<div class="fx__stage">
<div class="fx-swap">
<p data-on="1">전: 페이지마다 요청 하나.</p>
<p data-on="2">후: 세션마다 요청 하나.</p>
</div>
</div>
</figure>

## Slider

그림 안에 `<input type="range">`와 `<output>`을 두고 입력의 이름은 `<label>`로 붙입니다. `<label>` 하나는 컨트롤 하나의 이름이므로 `<output>`은 그 밖에 두고, `fx__range` 줄이 셋을 한 줄로 맞춥니다. 사이트는 값에 `data-unit`을 붙여 `<output>`에 쓰고, `min`과 `max` 사이의 비율을 그림의 `--fx-v` 변수로 주어 장면이 `calc()`에서 쓸 수 있게 합니다.

### Source

```html
<figure class="fx" data-fx="range" aria-label="캐시 수명">
<div class="fx__stage">
<div class="fx-box" style="width: calc(20% + var(--fx-v, 0) * 80%)">수명</div>
</div>
<div class="fx__range"><label for="cache-seconds">초</label> <input id="cache-seconds" type="range" min="0" max="60" value="30" data-unit="초"> <output></output></div>
</figure>
```

### Result

<figure class="fx" data-fx="range" aria-label="캐시 수명">
<div class="fx__stage">
<div class="fx-box" style="width: calc(20% + var(--fx-v, 0) * 80%)">수명</div>
</div>
<div class="fx__range"><label for="cache-seconds">초</label> <input id="cache-seconds" type="range" min="0" max="60" value="30" data-unit="초"> <output></output></div>
</figure>

## Run box

코드 블록 바로 뒤에 빈 `<div class="fx" data-fx="run"></div>`를 둡니다. 사이트가 실행, 코드 고치기, 처음 코드로 버튼을 더하고 코드가 출력한 내용을 보입니다.
코드 고치기는 코드를 입력 상자로 열고 상자가 열린 동안 고치기 닫기로 바뀌며, 실행은 상자 안의 코드를 실행합니다. 처음 코드로는 진행 중인 실행을 멈추고 작성한 코드를 되돌리며 출력을 지웁니다.
`console.log`, `info`, `warn`, `error`와 잡히지 않은 오류, 거부된 Promise를 한 줄씩 보입니다. 문자열은 그대로, 객체와 배열은 JSON으로, 함수는 이름으로 출력합니다.

### Source

````markdown
```js
const seen = new Set([1, 2, 2, 3]);
console.log(seen.size, [...seen]);
```

<div class="fx" data-fx="run"></div>
````

### Result

```js
const seen = new Set([1, 2, 2, 3]);
console.log(seen.size, [...seen]);
```

<div class="fx" data-fx="run"></div>

### Sandbox

코드는 `sandbox="allow-scripts"` 외의 권한이 없는 숨은 `<iframe>`에서 실행합니다. 같은 출처 접근이 없어 페이지와 페이지의 쿠키, 저장소를 읽을 수 없고 페이지를 이동하거나 `alert` 같은 대화상자를 열 수도 없습니다.
출력은 실행을 누른 뒤 2초 동안 모으고 그다음 프레임을 지웁니다. 늦게 출력하는 코드는 실행 상자에 밀리초 단위의 `data-wait`를 적습니다.
샌드박스 프레임은 페이지의 메인 스레드를 함께 쓰므로 코드에 끝나지 않는 반복이 있으면 페이지 전체가 멈출 수 있습니다. 예제는 스스로 끝나게 씁니다.
실행마다 새 프레임과 그림별 카운터의 다음 번호를 씁니다. 그 프레임에서 그 번호로 온 콘솔 줄만 보이므로 이전 실행이나 다른 그림의 출력이 섞이지 않습니다.

## Custom scenes

`steps` 종류의 그림도 작성자의 스크립트로 그릴 수 있습니다. 그림에서 `fx:step`을 받아 `event.detail.step`의 장면을 처음부터 다시 그리면 스크러버를 뒤로 끌어도 맞는 장면이 보입니다.
그림 이벤트는 버블링하지 않습니다. 부모 요소가 아니라 그림에서 직접 받으며 슬라이더의 `fx:input`도 같습니다.
작성자 스크립트에서 단계를 옮기려면 그림에 `fx:goto`를 보냅니다. `new CustomEvent("fx:goto", {detail: {step: 1, play: true}})`는 1단계부터 다시 재생합니다. `fx:goto`는 `steps` 그림만 처리합니다.

```html
<figure class="fx" data-fx="steps" id="count" data-steps="3" aria-label="단계 표시">
<div class="fx__stage"><p class="fx-box" id="count-out"></p></div>
</figure>
<script type="module">
const root = document.getElementById("count");
root.addEventListener("fx:step", (event) => {
  document.getElementById("count-out").textContent = `3단계 중 ${event.detail.step}단계`;
});
</script>
```

<figure class="fx" data-fx="steps" id="count" data-steps="3" aria-label="단계 표시">
<div class="fx__stage"><p class="fx-box" id="count-out"></p></div>
</figure>
<script type="module">
const root = document.getElementById("count");
root.addEventListener("fx:step", (event) => {
  document.getElementById("count-out").textContent = `3단계 중 ${event.detail.step}단계`;
});
</script>

모듈 스크립트는 사이트가 그림을 준비하기 전에 실행되므로 리스너는 첫 `fx:step`도 받습니다.
지도를 끌어 보는 장면처럼 단계가 없으면 `data-fx="custom"`을 씁니다. 장면은 같은 문서에 쓴 `<script type="module">`이 맡고, 준비를 마치면 `fx--ready` 클래스를 붙입니다.
어느 종류의 그림이든 `data-icon`을 준 `button`은 띠와 같은 아이콘이 되고 버튼 글자가 이름이 됩니다. `<div class="fx__bar">` 안의 버튼과 `fx-button` 클래스를 준 버튼은 띠의 모양을 따르며 `aria-pressed="true"`가 눌린 버튼을 표시합니다.

## Reference

### Attributes

| 속성 | 위치 | 뜻 |
| --- | --- | --- |
| `data-fx` | 그림 | `steps`, `range`, `run`, `custom` |
| `data-steps` | 단계 그림 | 단계 수. 없으면 `fx__captions` 항목 수 |
| `data-labels` | 단계 그림 | `\|`로 나눈 탭 라벨 |
| `data-on` | 요소 | 요소가 보이는 단계 |
| `data-hl` | 요소 | 요소에 형광펜을 칠하는 단계. SVG 안에서는 `rect.fx-mark`에 적습니다 |
| `data-pos` | 요소 | `;`로 이은 `단계:x y` 쌍. 그 단계부터 요소를 그만큼의 픽셀로 옮깁니다 |
| `data-unit` | 슬라이더 입력 | 출력 값 뒤에 붙는 글자 |
| `data-empty` | 실행 상자 | 출력이 비었을 때 보이는 글자 |
| `data-wait` | 실행 상자 | 출력을 모으는 밀리초. 기본 2000 |
| `data-step` | 단계 그림, 사이트가 적음 | 현재 단계. `.fx[data-step="3"]` 같은 선택자에 씁니다 |
| `data-value` | 슬라이더 그림, 사이트가 적음 | 현재 입력 값 |
| `data-icon` | 버튼 | `play`, `pause`, `prev`, `next`. 버튼 글자가 이름이 됩니다 |

### Events

| 이벤트 | 방향 | `detail` |
| --- | --- | --- |
| `fx:step` | 그림에서 작성자 스크립트로 | 단계가 바뀌거나 이동 요청을 받을 때마다 `{step}`. 첫 단계도 포함 |
| `fx:goto` | 작성자 스크립트에서 그림으로 | `{step, play}`. 둘 다 선택이고 `step` 기본값은 1. `play: true`는 그 단계부터 재생. detail이 올바르지 않으면 재생 없이 1단계 |
| `fx:input` | 그림에서 작성자 스크립트로 | 슬라이더가 바뀔 때마다 `{value, ratio}`. 처음 값도 포함 |

### Classes and variables

배치 클래스: `fx__stage`(장면), `fx__captions`(단계마다 `li` 하나), `fx-cols`(좁은 화면에서 쌓이는 격자), `fx-pair`(나란히 놓은 두 장면), `fx-scroll`(휴대폰에서 옆으로 스크롤하는 SVG), `fx-row`(줄을 넘기는 가로 줄), `fx-lane`(테두리가 있는 칩 줄), `fx-swap`(자식을 한 자리에 겹침). `<figcaption>`은 작은 회색 글자로 보입니다.
조작과 상태 클래스: `fx__range`(슬라이더 줄), `fx__bar`(작성자 버튼을 담는 띠), `fx--ready`(준비를 마친 그림. 사이트가 붙이고 직접 그리는 그림에는 작성자 스크립트가 붙입니다).
요소 클래스: `fx-box`, `fx-chip`과 `fx-chip--mine`, `fx-chip--dash`, `fx-lines`(코드 줄 목록), `fx-label`, `fx-muted`, `fx-button`. SVG 안의 글자는 `fx-strong`, `fx-muted`, `fx-mono`, 도형은 `fx-box`, `fx-mine`, `fx-ground`, `fx-dash`, `fx-ln`, `fx-ln-strong`, `fx-arrow`, `fx-mark`입니다.
그림에 선언해 작성자 스타일이 읽을 수 있는 변수: `--fx-line`, `--fx-line-strong`, `--fx-ink`, `--fx-ink-strong`, `--fx-ink-muted`, `--fx-fill`, `--fx-ground`, `--fx-mark`, `--fx-ph`, `--fx-ease`. 밝은 테마와 어두운 테마를 따릅니다. 슬라이더 그림에는 `--fx-v`도 있습니다.

### Without JavaScript

페이지는 서버 HTML을 그대로 보입니다. `data-on`이 없거나 `-`로 끝나는 요소가 보이고 형광펜은 칠하지 않으며 `data-pos` 요소는 쓴 자리에 그대로 있습니다. 설명은 모두 나열되고 띠가 없으며 실행 상자는 코드 블록 아래에 아무것도 보이지 않습니다. 마지막 단계의 요소는 `3`이 아니라 `3-`처럼 끝까지 가는 범위로 적고, 이 화면만으로 핵심이 전해지도록 장면을 씁니다.

### Language

띠의 버튼과 스크러버, 실행 상자의 버튼과 코드 입력 상자의 이름, 빈 실행 상자의 글자는 영어입니다. 페이지 언어가 `ko`이거나 `ko-KR` 같은 `ko`의 지역 형식이면 한국어입니다. 제목 아래 날짜 라벨과 같은 규칙입니다.
