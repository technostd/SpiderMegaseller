import {Link} from "react-router-dom";

export default function HeaderLinkButton (props: {to: string}) {
    return (
        <Link to={props.to}>Инструкции</Link>
    )
}