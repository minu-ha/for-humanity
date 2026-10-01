import {Close, Content, Description, Overlay, Portal, Root, Title, Trigger} from "@radix-ui/react-dialog";
import {copy_note_body, copy_note_close, copy_note_title} from "@/constant/copy";
import "./wg-note.css";

/**
 * 쪽지. 단추를 누르면 Radix Dialog 가 열린다. React 라이브러리가 섬으로 도는지 재는 시험용 부품이다.
 * 서버는 단추만 그리고 (Portal 은 서버에서 비어 있다), 브라우저가 이어받은 뒤에 열린다
 */
export interface WgNoteProps {
	/**
	 * 단추의 글. `::note[글]` 의 글이다
	 */
	label: string;
}

export const WgNote = (props: WgNoteProps) => {
	return (
		<Root>
			<Trigger className="wg_note__trigger">{props.label}</Trigger>
			<Portal>
				<Overlay className="wg_note__overlay" />
				<Content className="wg_note__content">
					<Title className="wg_note__title">{copy_note_title}</Title>
					<Description className="wg_note__body">{copy_note_body}</Description>
					<Close className="wg_note__close">{copy_note_close}</Close>
				</Content>
			</Portal>
		</Root>
	);
};
