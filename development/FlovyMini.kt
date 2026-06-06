/*
 * FlovyMini.kt — Compose Multiplatform port of apps/flovy/flovymini.html
 *
 * Single-file experiment. The same source runs on:
 *   · desktop (JVM)     → fun main() = singleWindowApplication { FlovyMiniApp() }
 *   · web (Wasm)        → fun main() = CanvasBasedWindow("FlovyMini") { FlovyMiniApp() }
 *   · Android           → inside an Activity:  setContent { FlovyMiniApp() }
 *
 * Build setup (when you actually want to compile):
 *   build.gradle.kts:
 *     plugins {
 *       kotlin("multiplatform") version "2.1.0"
 *       id("org.jetbrains.compose") version "1.7.0"
 *     }
 *     kotlin {
 *       jvm(); js(IR) { browser() }; androidTarget()
 *       sourceSets.commonMain.dependencies {
 *         implementation(compose.runtime)
 *         implementation(compose.foundation)
 *         implementation(compose.material3)
 *         implementation(compose.ui)
 *       }
 *     }
 *
 * What's ported 1:1 from flovymini.html:
 *   · personality picker (Lovely / Joy / Wisdom) — 3 rays
 *   · per-personality title + slogan that swap reactively
 *   · entry textarea with placeholder
 *   · 3 wizards cycling 1 → 2 → 3 → 1, each injecting a different ghost suggestion
 *   · i18n EN ↔ ES with a single source of truth (Strings object)
 *   · brand mark that swaps glyph (♡ → ❤/✿/☽) when a personality is picked
 *
 * Not ported (very HTML/CSS-specific or out of scope for the mini tier):
 *   · compass display-modes (scope/cloud/random layouts) — those rely on
 *     `body:has(:checked)` rewriting siblings' transforms in CSS; Compose
 *     would model them as a Modifier chain selected by a State<DisplayMode>.
 *   · tier-pop 5-level popover — would be a DropdownMenu in Compose.
 *   · "Add new language" copy-paste helper — only relevant in the web tier.
 */

package org.flove.flovy

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ── Design tokens (mirror flovymini's :root CSS variables) ──────────────
private val Accent     = Color(0xFFD32F2F)
private val AccentDeep = Color(0xFF9A0007)
private val Ink        = Color(0xFF212121)
private val InkSoft    = Color(0xFF5A5A5A)
private val InkMute    = Color(0xFF8A8A8A)
private val Line       = Color(0x1A000000)
private val FillSoft   = Color(0x14D32F2F)
private val PageBg     = Color(0xFFFAFAFA)

// ── Domain ──────────────────────────────────────────────────────────────
enum class Personality(val mark: String, val emoji: String) {
    Lovely("❤", "😍"),
    Joy   ("✿", "😂"),
    Wisdom("☽", "🔥"),
}

enum class Lang { EN, ES }

data class L(val en: String, val es: String) {
    fun t(lang: Lang): String = if (lang == Lang.ES) es else en
}

// One source of truth for every translatable string, same shape as
// flovymini's <span class="l-en"/><span class="l-es"/> pairs.
private object Strings {
    val moodLovely  = L("· lovely",  "· cariño")
    val moodJoy     = L("· joy",     "· alegría")
    val moodWisdom  = L("· wisdom",  "· sabiduría")

    val titleLovely = L("A careful word", "Una palabra cuidadosa")
    val titleJoy    = L("A bright spark", "Una chispa brillante")
    val titleWisdom = L("A quiet truth",  "Una verdad tranquila")

    val sloganLovely = L("Held with care · take your time.",
                         "Sostenido con cuidado · tómate tu tiempo.")
    val sloganJoy    = L("Bring snacks · let's have fun!",
                         "Trae snacks · ¡vamos a divertirnos!")
    val sloganWisdom = L("Listen for what the room is saying.",
                         "Escucha lo que dice la sala.")

    val placeholder = L("What's in your love", "¿Qué hay en tu amor?")
    val addBtn      = L("Add", "Añadir")

    // Three suggestion steps per personality — wizards cycle 1 → 2 → 3 → 1
    val suggestions: Map<Personality, List<L>> = mapOf(
        Personality.Lovely to listOf(
            L("Dear reader, with care and respect, I share the following for your consideration.",
              "Estimado lector, con cuidado y respeto, comparto lo siguiente para tu consideración."),
            L("If it helps, I'm here — softly, slowly, on your terms.",
              "Si ayuda, aquí estoy — con suavidad, despacio, a tu ritmo."),
            L("Thank you for trusting me with this. Let's hold it gently.",
              "Gracias por confiarme esto. Sostengámoslo con delicadeza."),
        ),
        Personality.Joy to listOf(
            L("Hey! What if we do it together and have a blast? 🎈",
              "¡Eh! ¿Y si lo hacemos juntos y la pasamos genial? 🎈"),
            L("Plot twist: we make it a game and laugh through it. 🎲",
              "Giro inesperado: lo convertimos en juego y nos reímos. 🎲"),
            L("Snacks ready, music up — let's gooo! 🍿✨",
              "Snacks listos, música arriba — ¡vamos! 🍿✨"),
        ),
        Personality.Wisdom to listOf(
            L("Where the air leans and the silence writes, there beats what has no name yet.",
              "Donde el aire se inclina y el silencio escribe, late lo que aún no tiene nombre."),
            L("The river does not argue with the stone; it learns the stone's shape.",
              "El río no discute con la piedra; aprende la forma de la piedra."),
            L("What we cannot say aloud, we can say slowly — and still be heard.",
              "Lo que no podemos decir en voz alta, podemos decirlo despacio — y seguir siendo escuchados."),
        ),
    )
}

private fun titleFor(p: Personality): L = when (p) {
    Personality.Lovely -> Strings.titleLovely
    Personality.Joy    -> Strings.titleJoy
    Personality.Wisdom -> Strings.titleWisdom
}

private fun moodFor(p: Personality): L = when (p) {
    Personality.Lovely -> Strings.moodLovely
    Personality.Joy    -> Strings.moodJoy
    Personality.Wisdom -> Strings.moodWisdom
}

private fun sloganFor(p: Personality): L = when (p) {
    Personality.Lovely -> Strings.sloganLovely
    Personality.Joy    -> Strings.sloganJoy
    Personality.Wisdom -> Strings.sloganWisdom
}

// ── App ─────────────────────────────────────────────────────────────────
@Composable
fun FlovyMiniApp() {
    var lang        by remember { mutableStateOf(Lang.EN) }
    var personality by remember { mutableStateOf<Personality?>(null) }
    var wizardStep  by remember { mutableStateOf(0) }   // 0 = none; 1..3 = step
    var text        by remember { mutableStateOf("") }

    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = PageBg) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .widthIn(max = 420.dp)
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Topbar(
                    personality = personality,
                    lang = lang,
                    onLangToggle = { lang = if (lang == Lang.EN) Lang.ES else Lang.EN },
                )

                PersonalityRays(
                    selected = personality,
                    onPick = { p ->
                        // Tapping the selected ray deselects (matches flovymini)
                        personality = if (personality == p) null else p
                        wizardStep = 0
                    },
                )

                personality?.let { p ->
                    Text(
                        text = titleFor(p).t(lang),
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 22.sp,
                        color = Ink,
                    )
                    Text(
                        text = sloganFor(p).t(lang),
                        color = InkSoft,
                        fontSize = 13.sp,
                    )
                }

                EntryField(
                    text = text,
                    onTextChange = { text = it },
                    placeholder = Strings.placeholder.t(lang),
                    suggestion = suggestionFor(personality, wizardStep, lang),
                )

                if (personality != null) {
                    WizardsRow(
                        active = personality,
                        step = wizardStep,
                        onWizardTap = { tapped ->
                            personality = tapped
                            // Same wizard → advance; different wizard → start at 1
                            wizardStep = if (tapped == personality) (wizardStep % 3) + 1 else 1
                        },
                        onAdd = {
                            // In flovymini this submits a mailto: form. In Compose
                            // you'd use the platform URI handler (LocalUriHandler).
                            // Left as a stub to keep this file dependency-free.
                        },
                        addLabel = Strings.addBtn.t(lang),
                    )
                }
            }
        }
    }
}

// ── Pieces ──────────────────────────────────────────────────────────────
@Composable
private fun Topbar(
    personality: Personality?,
    lang: Lang,
    onLangToggle: () -> Unit,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth(),
    ) {
        // Brand mark — ♡ until a personality picks the glyph
        Text(
            text = personality?.mark ?: "♡",
            color = Accent,
            fontSize = 26.sp,
        )
        Spacer(Modifier.width(8.dp))
        Text(
            text = "flovy",
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Bold,
            fontSize = 22.sp,
            color = Accent,
        )
        personality?.let {
            Spacer(Modifier.width(4.dp))
            Text(
                text = moodFor(it).t(lang),
                fontFamily = FontFamily.Serif,
                fontSize = 14.sp,
                color = Accent,
            )
        }
        Spacer(Modifier.weight(1f))
        TextButton(onClick = onLangToggle) {
            Text(if (lang == Lang.EN) "🇪🇸" else "🇬🇧", fontSize = 16.sp)
        }
    }
}

@Composable
private fun PersonalityRays(
    selected: Personality?,
    onPick: (Personality) -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Personality.entries.forEach { p ->
            val isOn = selected == p
            Surface(
                shape = CircleShape,
                color = if (isOn) Accent else Color.White,
                border = BorderStroke(
                    width = if (isOn) 2.dp else 1.dp,
                    color = if (isOn) AccentDeep else Line,
                ),
                onClick = { onPick(p) },
                modifier = Modifier.size(36.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(p.emoji, fontSize = 16.sp)
                }
            }
        }
    }
}

@Composable
private fun EntryField(
    text: String,
    onTextChange: (String) -> Unit,
    placeholder: String,
    suggestion: String?,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .border(2.dp, if (text.isNotEmpty()) Accent else Line, RoundedCornerShape(12.dp))
            .background(Color.Transparent)
            .padding(horizontal = 14.dp, vertical = 12.dp),
    ) {
        Column {
            BasicTextField(
                value = text,
                onValueChange = onTextChange,
                modifier = Modifier.fillMaxWidth().heightIn(min = 60.dp),
                textStyle = TextStyle(fontSize = 18.sp, color = Ink),
                decorationBox = { inner ->
                    if (text.isEmpty() && suggestion == null) {
                        Text(placeholder, color = InkMute, fontSize = 18.sp)
                    }
                    inner()
                },
            )
            // Ghost suggestion — only visible while the user hasn't typed
            if (text.isEmpty() && suggestion != null) {
                Text(
                    text = suggestion,
                    color = InkMute,
                    fontSize = 18.sp,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun WizardsRow(
    active: Personality?,
    step: Int,
    onWizardTap: (Personality) -> Unit,
    onAdd: () -> Unit,
    addLabel: String,
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Personality.entries.forEach { p ->
            val on = active == p && step > 0
            Surface(
                shape = CircleShape,
                color = if (on) Accent else FillSoft,
                onClick = { onWizardTap(p) },
                modifier = Modifier.size(32.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(p.emoji, fontSize = 14.sp)
                }
            }
        }
        Spacer(Modifier.weight(1f))
        Button(
            onClick = onAdd,
            colors = ButtonDefaults.buttonColors(containerColor = Accent),
            shape = RoundedCornerShape(999.dp),
            contentPadding = PaddingValues(horizontal = 18.dp, vertical = 8.dp),
        ) {
            Text("＋ $addLabel", color = Color.White, fontSize = 14.sp)
        }
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────
private fun suggestionFor(p: Personality?, step: Int, lang: Lang): String? {
    if (p == null || step !in 1..3) return null
    val list = Strings.suggestions[p] ?: return null
    return list[step - 1].t(lang)
}
