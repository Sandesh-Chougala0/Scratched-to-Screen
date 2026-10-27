import base64
import time
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Auto Archival Scratch Repair API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AutoInpaintRequest(BaseModel):
    image_base64: str
    scratch_sensitivity: int = 15  # Sensitivity threshold for scratch detection
    algorithm: str = "telea"       # 'telea' or 'ns'


def base64_to_cv2(b64_string: str) -> np.ndarray:
    try:
        if "," in b64_string:
            b64_string = b64_string.split(",")[1]
        image_bytes = base64.b64decode(b64_string)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Base64 image data: {str(e)}")


def cv2_to_base64(img: np.ndarray) -> str:
    _, buffer = cv2.imencode(".png", img)
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def auto_detect_scratches(img: np.ndarray, sensitivity: int = 15) -> np.ndarray:
    """Detects vertical film scratches automatically using morphological filtering."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Apply vertical morphological filter to highlight vertical scratch structures
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 15))
    morphed = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel)

    # 2. Find difference between original gray image and vertical-opened image
    diff = cv2.absdiff(gray, morphed)

    # 3. Threshold to turn detected scratches into a binary white mask
    _, mask = cv2.threshold(diff, sensitivity, 255, cv2.THRESH_BINARY)

    # 4. Dilate slightly to make sure scratch edges are covered
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=1)

    return mask


@app.post("/api/auto-inpaint")
def auto_inpaint_image(payload: AutoInpaintRequest):
    start_time = time.time()

    # 1. Decode original image
    img = base64_to_cv2(payload.image_base64)

    # 2. Automatically generate scratch mask
    auto_mask = auto_detect_scratches(img, payload.scratch_sensitivity)

    # 3. Perform Inpainting using auto-generated mask
    flag = cv2.INPAINT_TELEA if payload.algorithm.lower() == "telea" else cv2.INPAINT_NS
    restored_img = cv2.inpaint(img, auto_mask, inpaintRadius=3, flags=flag)

    # 4. Return results + generated mask preview
    elapsed_time_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "restored_image_base64": cv2_to_base64(restored_img),
        "auto_detected_mask_base64": cv2_to_base64(auto_mask),
        "processing_time_ms": elapsed_time_ms,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)