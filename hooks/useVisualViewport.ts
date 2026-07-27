import { useEffect, useState } from "react";

export function useVisualViewport() {
    const [viewportDetail, setViewportDetail] = useState({
        height: window.innerHeight,
        offsetTop: 0
    });

    useEffect(() => {
        if (!window.visualViewport) return;

        const handleResize = () => {
            const viewport = window.visualViewport;
            if (!viewport) return;

            setViewportDetail({
                height: viewport.height,
                offsetTop: viewport.offsetTop
            });
        };

        window.visualViewport.addEventListener("resize", handleResize);
        window.visualViewport.addEventListener("scroll", handleResize);
        
        handleResize();

        return () => {
            window.visualViewport?.removeEventListener("resize", handleResize);
            window.visualViewport?.removeEventListener("scroll", handleResize);
        };
    }, []);

    return viewportDetail;
}
