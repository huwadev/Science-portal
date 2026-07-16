package org.esss.science.eclipses

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View

/**
 * Eclipses & Transits Lab - Custom View for drawing local solar eclipse circumstances.
 * Ideal for embedding interactive eclipse previews on Android canvas.
 */
class EclipseView @JvmOverloads constructor(
    context: Context, 
    attrs: AttributeSet? = null, 
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val sunPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        // Give the sun a nice warm halo glow effect
        shadowLayer = 30f, 0f, 0f, Color.parseColor("#FFE600")
        // Required for shadow rendering when hardware acceleration is active
        setLayerType(LAYER_TYPE_SOFTWARE, null)
    }

    private val moonPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#060814") // Dark space-colored moon
    }

    private val coronaPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#A0FFFFFF") // Translucent white corona
    }

    private var obscuration: Float = 0f
    private var moonOffsetDx: Float = 0f
    private var moonOffsetDy: Float = 0f

    /**
     * Updates the local eclipse drawing.
     * @param obsc Obscuration ratio (0.0 to 1.0)
     * @param dx Moon offset on X-axis (pixels)
     * @param dy Moon offset on Y-axis (pixels)
     */
    fun updateEclipse(obsc: Float, dx: Float, dy: Float) {
        this.obscuration = obsc
        this.moonOffsetDx = dx
        this.moonOffsetDy = dy
        invalidate() // Redraw view
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val cx = width / 2f
        val cy = height / 2f
        val sunRadius = width * 0.22f

        // Draw Corona during maximum obscuration (totality)
        if (obscuration >= 0.98f) {
            canvas.drawCircle(cx, cy, sunRadius * 1.5f, coronaPaint)
        }

        // Draw Sun
        canvas.drawCircle(cx, cy, sunRadius, sunPaint)

        // Draw Moon disk (positioned based on relative coordinates)
        val mx = cx + moonOffsetDx
        val my = cy + moonOffsetDy
        canvas.drawCircle(mx, my, sunRadius * 1.01f, moonPaint)
    }
}
