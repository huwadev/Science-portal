package org.esss.science.eclipses

import kotlin.math.*

/**
 * Eclipses & Transits Lab - Kotlin calculator for Android apps
 * Replicates the geocentric-spherical intersection calculations to find Moon shadow center on Earth.
 */
object EclipseCalculator {
    const val RE_KM = 6378.137
    const val RS_KM = 696340.0
    const val RM_KM = 1737.4
    const val AU_KM = 149597870.7

    data class Vector3D(val x: Double, val y: Double, val z: Double) {
        operator fun minus(v: Vector3D) = Vector3D(x - v.x, y - v.y, z - v.z)
        operator fun plus(v: Vector3D) = Vector3D(x + v.x, y + v.y, z + v.z)
        fun dot(v: Vector3D) = x * v.x + y * v.y + z * v.z
        fun length() = sqrt(x*x + y*y + z*z)
    }

    data class ShadowIntersection(
        val lat: Double,
        val lon: Double,
        val ru: Double, // Negative: Annular shadow radius, Positive: Total shadow radius (km)
        val rp: Double, // Penumbral shadow radius (km)
        val isVisible: Boolean
    )

    /**
     * Calculates the shadow coordinates and radii on Earth's surface.
     * @param sun Geocentric J2000 Sun vector in AU.
     * @param moon Geocentric J2000 Moon vector in AU.
     * @param gmstHours Greenwich Mean Sidereal Time in decimal hours.
     */
    fun calculateShadowCenter(
        sun: Vector3D, 
        moon: Vector3D, 
        gmstHours: Double
    ): ShadowIntersection? {
        val D = moon - sun
        val RE_AU = RE_KM / AU_KM

        val A = D.dot(D)
        val B = 2.0 * moon.dot(D)
        val C = moon.dot(moon) - RE_AU * RE_AU

        val disc = B*B - 4*A*C
        if (disc < 0) return null // Axis misses the Earth

        val u = (-B - sqrt(disc)) / (2.0*A)
        if (u < 0) return null // Shadow points away from Earth

        // J2000 geocentric intersection vector
        val I = Vector3D(
            moon.x + u*D.x,
            moon.y + u*D.y,
            moon.z + u*D.z
        )

        // Convert to lat/lon using Earth Sidereal Rotation angle
        val theta = gmstHours * 15.0 * Math.PI / 180.0
        var lonRad = atan2(I.y, I.x) - theta
        while (lonRad < -Math.PI) lonRad += 2*Math.PI
        while (lonRad > Math.PI) lonRad -= 2*Math.PI

        val latRad = atan2(I.z, sqrt(I.x*I.x + I.y*I.y))
        
        // Shadow Radii in km
        val distIntersection = sqrt((I.x - moon.x).pow(2) + (I.y - moon.y).pow(2) + (I.z - moon.z).pow(2)) * AU_KM
        val distSunMoon = D.length() * AU_KM

        val sinAlpha = (RS_KM - RM_KM) / distSunMoon
        val Lu = RM_KM / sinAlpha
        val ru = RM_KM * (1.0 - distIntersection / Lu)

        val sinBeta = (RS_KM + RM_KM) / distSunMoon
        val Lp = RM_KM / sinBeta
        val rp = RM_KM * (1.0 + distIntersection / Lp)

        return ShadowIntersection(
            lat = latRad * 180.0 / Math.PI,
            lon = lonRad * 180.0 / Math.PI,
            ru = ru,
            rp = rp,
            isVisible = true
        )
    }
}
