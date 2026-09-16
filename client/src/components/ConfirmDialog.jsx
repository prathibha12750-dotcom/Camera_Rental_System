import {
  useEffect,
  useRef,
} from "react";


const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  tone = "danger",
}) => {

  const cancelButtonRef =
    useRef(null);


  // ==========================================
  // ESCAPE + FOCUS
  // ==========================================

  useEffect(() => {

    if (!open) {
      return undefined;
    }


    const handleKeyDown = (
      event
    ) => {

      if (
        event.key === "Escape" &&
        !loading
      ) {

        onCancel();

      }

    };


    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    const previousOverflow =
      document.body.style.overflow;


    document.body.style.overflow =
      "hidden";


    const focusTimer =
      window.setTimeout(
        () => {

          cancelButtonRef.current
            ?.focus();

        },
        0
      );


    return () => {

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );


      document.body.style.overflow =
        previousOverflow;


      window.clearTimeout(
        focusTimer
      );

    };

  }, [
    open,
    loading,
    onCancel,
  ]);


  if (!open) {
    return null;
  }


  const confirmButtonClass =
    tone === "danger"
      ? `
          bg-red-600
          text-white
          hover:bg-red-700
          focus-visible:ring-red-500
        `
      : `
          bg-orange-600
          text-white
          hover:bg-orange-700
          focus-visible:ring-orange-500
        `;


  return (

    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        p-4
      "
      role="presentation"
    >


      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close confirmation dialog"
        onClick={
          loading
            ? undefined
            : onCancel
        }
        className="
          absolute
          inset-0
          cursor-default
          bg-gray-950/50
        "
      />


      {/* DIALOG */}

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="
          relative
          z-10
          w-full
          max-w-md
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-5
          shadow-xl
          sm:p-6
        "
      >

        <div
          className="
            flex
            items-start
            gap-4
          "
        >

          <div
            className={`
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              ${
                tone ===
                "danger"
                  ? `
                      bg-red-50
                      text-red-600
                    `
                  : `
                      bg-orange-50
                      text-orange-600
                    `
              }
            `}
            aria-hidden="true"
          >

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="
                h-5
                w-5
              "
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="
                  M12 9v4
                  m0 4h.01
                  M10.29 3.86
                  1.82-1.04
                  a2 2 0 0 1 2.78.74
                  l6.23 10.8
                  a2 2 0 0 1-1.74 3
                  H4.62
                  a2 2 0 0 1-1.74-3
                  l6.23-10.8
                  a2 2 0 0 1 1.18-.7
                "
              />
            </svg>

          </div>


          <div
            className="
              min-w-0
              flex-1
            "
          >

            <h2
              id="confirm-dialog-title"
              className="
                text-lg
                font-semibold
                text-gray-950
              "
            >
              {title}
            </h2>


            <p
              id="confirm-dialog-description"
              className="
                mt-2
                text-sm
                leading-6
                text-gray-600
              "
            >
              {message}
            </p>

          </div>

        </div>


        <div
          className="
            mt-6
            flex
            flex-col-reverse
            gap-3
            sm:flex-row
            sm:justify-end
          "
        >

          <button
            ref={
              cancelButtonRef
            }
            type="button"
            onClick={
              onCancel
            }
            disabled={
              loading
            }
            className="
              rounded-xl
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-gray-700
              transition
              hover:bg-gray-50
              disabled:cursor-not-allowed
              disabled:opacity-50
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-gray-400
              focus-visible:ring-offset-2
            "
          >
            {cancelLabel}
          </button>


          <button
            type="button"
            onClick={
              onConfirm
            }
            disabled={
              loading
            }
            className={`
              rounded-xl
              px-4
              py-2.5
              text-sm
              font-semibold
              shadow-sm
              transition
              disabled:cursor-not-allowed
              disabled:opacity-50
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-offset-2
              ${confirmButtonClass}
            `}
          >
            {loading
              ? "Please wait..."
              : confirmLabel}
          </button>

        </div>

      </div>

    </div>

  );

};


export default ConfirmDialog;