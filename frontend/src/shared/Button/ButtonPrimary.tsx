import {Link} from "react-router-dom";

export default (props: { to: string, text: string }) => (
    <Link to={props.to}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2">
        {props.text}
    </Link>
)