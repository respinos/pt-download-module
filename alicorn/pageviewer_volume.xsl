<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:h="http://www.hathitrust.org"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS h"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:import href="str.replace.function.xsl" />

  <!-- Global Variables -->
  <xsl:variable name="gCurrentPageImageSource" select="/MBooksTop/MBooksGlobals/CurrentPageImageSource"/>
  <xsl:variable name="gCurrentPageImageWidth" select="/MBooksTop/MBooksGlobals/CurrentPageImageWidth"/>
  <xsl:variable name="gCurrentPageImageHeight" select="/MBooksTop/MBooksGlobals/CurrentPageImageHeight"/>
  <xsl:variable name="gCurrentPageOcr" select="/MBooksTop/MBooksGlobals/CurrentPageOcr"/>
  <xsl:variable name="gCurrentPageNum" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']"/>
  <xsl:variable name="gCurrentPageFeatures" select="/MBooksTop/MdpApp/CurrentPageFeatures"/>

  <xsl:variable name="gCurrentView">
    <xsl:variable name="currentView" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']" />
    <xsl:choose>
      <!-- <xsl:when test="$gFinalAccessStatus != 'allow'">thumb</xsl:when> -->
      <xsl:when test="$currentView = 'text'">plaintext</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$currentView" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gUsingBookReader">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus!='allow'"><xsl:value-of select="'false'" /></xsl:when>
      <xsl:when test="$gCurrentView = '1up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = '2up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = 'thumb'"><xsl:value-of select="'true'" /></xsl:when>
      <!-- <xsl:when test="$gCurrentView = 'text'"><xsl:value-of select="'true'" /></xsl:when> -->
      <xsl:otherwise><xsl:value-of select="'false'" /></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gFinalView">
    <xsl:choose>
      <xsl:when test="contains($gCurrentPageFeatures,'MISSING_PAGE') and $gUsingBookReader = 'false'">
        <xsl:value-of select="'missing'"/>
      </xsl:when>
      <xsl:when test="$gCurrentView='image' or $gUsingBookReader = 'true'">
        <xsl:value-of select="$gCurrentView"/>
      </xsl:when>
      <xsl:when test="$gCurrentPageOcr=''">
        <xsl:value-of select="'empty'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$gCurrentView"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gViewIsResizable">
    <xsl:choose>
      <xsl:when test="$gFinalView='restricted' or $gFinalView='empty' or $gFinalView='missing'">
        <xsl:value-of select="'false'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'true'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gShowViewTypes">
    <xsl:choose>
      <xsl:when test="$gFinalView='restricted'">
        <xsl:value-of select="'false'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'true'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="currentSize" select="number(//CurrentCgi/Param[@name='size'])" />
  <xsl:variable name="currentOrient" select="number(//CurrentCgi/Param[@name='orient'])" />
  <xsl:variable name="gMinImageHeight">
    <xsl:choose>
      <xsl:when test="$currentOrient = '1' or $currentOrient = '3'">
        <xsl:value-of select="(680 * ( $currentSize div 100 ))" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="(680 * ( $currentSize div 100 ))" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gUsingPageImages">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus!='allow'"><xsl:value-of select="'false'" /></xsl:when>
      <xsl:when test="$gCurrentView = '1up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = '2up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = 'thumb'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = 'image'"><xsl:value-of select="'true'" /></xsl:when>
      <!-- <xsl:when test="$gCurrentView = 'text'"><xsl:value-of select="'true'" /></xsl:when> -->
      <xsl:otherwise><xsl:value-of select="'false'" /></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="setup-extra-header-extra">
    <xsl:call-template name="build-css-link">
      <xsl:with-param name="href" select="'/pt/alicorn/css/main.css'" />
    </xsl:call-template>

    <!-- <link rel="stylesheet" href="/pt/alicorn/css/main.css?_{$gTimestamp}" /> -->
    <!-- <link rel="stylesheet" href="/pt/css/print.css{$timestamp}" media="print" /> -->

    <xsl:if test="$gUsingPageImages = 'true'">
      <meta property="og:image" content="{//CurrentPageImageSource}" />
    </xsl:if>

  </xsl:template>

  <xsl:template name="setup-body-class">
    <xsl:if test="$gUsingBookReader = 'false'">
      <xsl:text> view-</xsl:text><xsl:value-of select="$gCurrentView" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-extra-html-attributes">
    <xsl:if test="$gUsingBookReader = 'true'">
      <xsl:attribute name="data-analytics-skip">true</xsl:attribute>
    </xsl:if>
    <xsl:attribute name="data-sidebar-collapsible">true</xsl:attribute>
  </xsl:template>

  <xsl:template name="setup-extra-html-class">
    <xsl:if test="$gSuppressAccessBanner = 'true'">
      <xsl:text> supaccban </xsl:text>
    </xsl:if>
    <xsl:if test="//Param[@name='debug'] = 'polite'">
      <xsl:text> debugpolite</xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" role="complementary" aria-label="Skip links">
      <ul>
        <li><a href="#section" accesskey="2">Skip to page content</a></li>
        <li><a href="/cgi/ssd?id={$gHtId}">Skip to text only view of this item</a></li>
        <li><a href="#input-search-text">Skip to search in this text</a></li>
        <!-- <li><a href="#sidebar">Skip to book options</a></li> -->
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="pageviewer-contents">
    <xsl:call-template name="sidebar" />
    <xsl:call-template name="main" />
  </xsl:template>

  <xsl:template name="main">
    <!-- <xsl:variable name="totalSeq" select="count(//METS:div[@TYPE='volume']/METS:div[@ORDER])" /> -->
    <xsl:variable name="currentSeq" select="//Param[@name='seq']" />
    <xsl:variable name="totalSeq" select="count(//METS:structMap[@TYPE='physical']/METS:div[@TYPE]/METS:div[@ORDER])" />
    <xsl:variable name="readingOrder" select="//Manifest/ReadingOrder" />
    <xsl:attribute name="data-has-ocr">
      <xsl:choose>
        <xsl:when test="$gHasOcr = 'YES'">true</xsl:when>
        <xsl:otherwise>false</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-allow-full-download">
      <xsl:choose>
        <xsl:when test="$gFullPdfAccess = 'allow'">true</xsl:when>
        <xsl:otherwise>false</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-reading-order"><xsl:value-of select="$readingOrder" /></xsl:attribute>
    <xsl:attribute name="data-total-seq"><xsl:value-of select="$totalSeq" /></xsl:attribute>
    <xsl:attribute name="data-default-seq"><xsl:value-of select="//Manifest/DefaultSeq" /></xsl:attribute>
    <xsl:attribute name="data-first-seq"><xsl:value-of select="//Manifest/FirstPageSeq" /></xsl:attribute>
    <xsl:attribute name="data-default-height"><xsl:value-of select="//Manifest/BaseImage/Height" /></xsl:attribute>
    <xsl:attribute name="data-default-width"><xsl:value-of select="//Manifest/BaseImage/Width" /></xsl:attribute>
    <xsl:attribute name="data-feature-list"><xsl:value-of select="//Manifest/FeatureList" /></xsl:attribute>

    <h2 class="offscreen">
      <xsl:call-template name="get-view-title" />
      <!-- <xsl:if test="$gHasOcr = 'YES'">
        <xsl:text> (use access key 5 to view full text / OCR mode)</xsl:text>
      </xsl:if> -->
    </h2>
    <div class="outer main" style="display: flex; flex-direction: column; flex-grow: 1">
      <xsl:call-template name="toolbar-horizontal" />
      <div class="inner main" style="flex-grow: 1">
        <xsl:call-template name="toolbar-vertical" />
        <section class="viewer viewer--setup">
          <div class="viewer-loader"></div>
          <div class="viewer-inner" tabindex="-1"></div>
        </section>
      </div>
    </div>
    <div class="navigator">
      <button class="action-expando for-mobile" aria-label="Toggle Menu"><i class="icomoon" aria-hidden="true"></i></button>
      <form>
        <label class="offscreen" for="control-navigator">Location: </label>
        <div class="control-navigator--wrap">
          <input id="control-navigator" type="range" name="locations-range-value" min="1" max="{$totalSeq}" aria-valuemin="1" aria-valuemax="{$totalSeq}" aria-valuenow="{$currentSeq}" aria-valuetext="{$currentSeq}/{$totalSeq}" value="1" data-background-position="0">
            <xsl:if test="$readingOrder = 'right-to-left'">
              <xsl:attribute name="dir">rtl</xsl:attribute>
            </xsl:if>
          </input>
        </div>
        <xsl:text> </xsl:text>
        <xsl:if test="false()">
          <div class="output">Page Scan <span data-slot="current-seq"><xsl:value-of select="$currentSeq" /></span> of <span data-slot="total-seq"><xsl:value-of select="$totalSeq" /></span><span data-slot="current-page-number"></span></div>
        </xsl:if>
        <div class="output"><span class="offscreen">Page Scan </span><span data-slot="current-seq">1</span> / <span data-slot="total-seq"><xsl:value-of select="$totalSeq" /></span></div>
        <xsl:text> </xsl:text>
        <button class="btn" id="action-prompt-seq" aria-label="Jump to location">Jump...</button>

        <button tabindex="-1" id="action-focus-current-page" aria-hidden="true" style="display: none" accesskey="9">Show Current Page</button>
        <button tabindex="-1" id="action-proxy-navigation-f" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="f" data-target="action-go-first">Go First</button>
        <button tabindex="-1" id="action-proxy-navigation-p" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="p" data-target="action-go-prev">Go Previous</button>
        <button tabindex="-1" id="action-proxy-navigation-x" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="x" data-target="action-go-next">Go Next</button>
        <button tabindex="-1" id="action-proxy-navigation-n" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="n" data-target="action-go-next">Go Next</button>
        <button tabindex="-1" id="action-proxy-navigation-l" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="l" data-target="action-go-last">Go Last</button>

      </form>
    </div>

    <!-- FIXME: does main.js need to load after all the other scripts?? -->
    <!-- <xsl:call-template name="build-js-link">
      <xsl:with-param name="href">/pt/alicorn/js/main.js</xsl:with-param>
    </xsl:call-template> -->

    <xsl:variable name="modtime" select="//Timestamp[@href='/pt/alicorn/js/main.js']/@modtime" />
    <script type="text/javascript">
      <xsl:text>head.load('/pt/alicorn/js/main.js?_</xsl:text>
      <xsl:value-of select="$modtime" />
      <xsl:text>')</xsl:text>
    </script>

    <xsl:call-template name="load-extra-main-script" />
  </xsl:template>

  <xsl:template name="build-main-container-extra">
    <!-- <button data-target="enter-fullscreen" id="action-mobile-toggle-fullscreen" type="button" class="btn square alone for-mobile" data-toggle="tracking" data-tracking-action="PT Full Screen" aria-label="View Full Screen"><i class="icomoon"></i></button> -->
  </xsl:template>

  <xsl:template name="load-extra-main-script" />

  <xsl:template name="xxx-main">
    <xsl:call-template name="toolbar-horizontal" />
    <xsl:call-template name="toolbar-vertical" />
    <!-- <div class="main-wrap"> -->
      <div class="pages">
        <div class="pages-inner"></div>
      </div>
      <div class="navigator">
        <!-- <input type="range" id="control-navigator" /> -->
        <input class="cozy-navigator-range__input" id="control-navigator" type="range" name="locations-range-value" min="0" max="100" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0% • Page Scan 0 of ?" value="0" data-background-position="0" />
        <!-- <div class="navigator-range__background"></div> -->
      </div>
    <!-- </div> -->
    <script type="text/javascript" src="/pt/alicorn/js/main.js"></script>
  </xsl:template>

  <xsl:template name="xx-main">
    <div class="main" id="main" role="main" tabindex="-1">
      <h2 class="offscreen">
        <xsl:call-template name="get-view-title" />
        <xsl:if test="$gHasOcr = 'YES'">
          <xsl:text> (use access key 5 to view full text / OCR mode)</xsl:text>
        </xsl:if>
      </h2>
      <xsl:call-template name="toolbar-horizontal" />
      <xsl:call-template name="toolbar-vertical" />
      <div id="scrolling">
        <xsl:call-template name="page-content" />
      </div>
    </div>
  </xsl:template>

  <xsl:template name="get-view-title">Main Content</xsl:template>

  <xsl:template name="build-pre-sidebar-panels">
    <div class="panel options for-mobile">
      <!-- <h3 class="for-mobile">View Options</h3> -->
      <ul>
        <li><button class="btn" data-trigger="contents"><span><i class="icomoon icomoon-list" aria-hidden="true"></i> Contents</span></button></li>
        <li style="margin-top: 1rem; margin-bottom: 1rem;">
          <form action="/cgi/pt/search" id="form-search-volume-2" class="form-search-volume" role="search" style="padding: 0.5rem; border: 1px solid #ddd">
            <label style="text-align: center" for="input-search-text">Search in this text </label>
            <input id="input-search-text" name="q1" type="text" style="width: 100%; margin-bottom: 0.25rem; display: block">
              <xsl:if test="$gHasOcr!='YES'">
                <xsl:attribute name="disabled">disabled</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="placeholder">
                <xsl:choose>
                  <xsl:when test="$gHasOcr = 'YES'">
                    <!-- <xsl:text>Search in this text</xsl:text> -->
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:text>No text to search in this item</xsl:text>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:attribute>
              <xsl:attribute name="value">
                <xsl:if test="$gHasOcr = 'YES' and $gCurrentQ1 != '*'">
                  <xsl:value-of select="$gCurrentQ1" />
                </xsl:if>
              </xsl:attribute>
            </input>
            <button class="btn" style="display: block; margin-left: 0" data-trigger="search"><span><i class="icomoon icomoon-search"></i> Find</span></button>
            <xsl:apply-templates select="//MdpApp/SearchForm/HiddenVars" />
            <input type="hidden" name="view" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']}" />
            <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
              <input type="hidden" name="seq" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']}" />
            </xsl:if>
            <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']">
              <input type="hidden" name="num" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']}" />
            </xsl:if>
            <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
              <input type="hidden" name="debug" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']}" />
            </xsl:if>
          </form>
        </li>

        <li class="toggle--500"><button class="btn action-zoom-in"><span><i class="icomoon icomoon-zoom-in"></i> Zoom In</span></button></li>
        <li class="toggle--500"><button class="btn action-zoom-out"><span><i class="icomoon icomoon-zoom-out"></i> Zoom Out</span></button></li>
        <li class="toggle--500"><button class="btn action-zoom-reset"><span><i class="icomoon icomoon-document"></i> Fit to Page</span></button></li>

        <li class="toggle--500" style="margin-top: 1rem">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">plaintext</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">1up</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">2up</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">thumb</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">image</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>


<!--         <li style="margin-top: 1rem"><button class="btn action-view" data-target="plaintext"><span><i class="icomoon icomoon-article"></i> View Plain Text</span></button></li>
        <li><button class="btn action-view" data-target="1up"><span><i class="icomoon icomoon-scroll"></i> Scroll Page Scans</span></button></li>
        <li><button class="btn action-view" data-target="2up"><span><i class="icomoon icomoon-book-alt2"></i> Flip Page Scans</span></button></li>
        <li><button class="btn action-view" data-target="2up"><span><i class="icomoon icomoon-gridview"></i> View Thumbnails</span></button></li>
        <li><button class="btn action-view" data-target="2up"><span><i class="icomoon icomoon-documents"></i> View Page by Page</span></button></li>
 -->      </ul>
    </div>
  </xsl:template>

  <xsl:template name="toolbar-vertical">
    <div id="toolbar-vertical" class="toolbar toolbar-vertical" role="toolbar" aria-label="Viewing Options">
      <div class="btn-group btn-group-vertical action-views">
        <xsl:call-template name="action-view-button">
          <xsl:with-param name="view">plaintext</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="action-view-button">
          <xsl:with-param name="view">1up</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="action-view-button">
          <xsl:with-param name="view">2up</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="action-view-button">
          <xsl:with-param name="view">thumb</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="action-view-button">
          <xsl:with-param name="view">image</xsl:with-param>
        </xsl:call-template>
      </div>
      <xsl:call-template name="action-fullscreen" />
      <xsl:call-template name="action-resize" />

      <div class="btn-group btn-group-vertical action-rotate">
        <button href="{//RotateLinks/CounterClockwiseLink}" id="action-rotate-counterclockwise" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Rotate Counterclockwise" aria-label="Rotate Counter-clockwise" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-reload-CCW"></i></button>
        <button href="{//RotateLinks/ClockwiseLink}" id="action-rotate-clockwise" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Rotate Clockwise" aria-label="Rotate Clockwise" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-reload-CW"></i></button>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="action-fullscreen">
    <div class="btn-group btn-group-vertical action-fullscreen" data-expanded="false">
      <button data-target="enter-fullscreen" id="action-toggle-enter-fullscreen" type="button" class="btn square alone" data-toggle="tracking" data-tracking-action="PT Full Screen" aria-label="View Full Screen" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-fullscreen"></i></button>
      <button data-target="exit-fullscreen" id="action-toggle-exit-fullscreen" type="button" class="btn square alone" data-toggle="tracking" data-tracking-action="PT Full Screen" aria-label="Exit Full Screen" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-fullscreen-exit"></i></button>
    </div>
  </xsl:template>

  <xsl:template name="action-resize">
    <div class="btn-group btn-group-vertical action-zoom">
      <button href="{//ResizeLinks/ResizeInLink}" id="action-zoom-in" type="button" class="btn square action-zoom-in" data-toggle="tracking" data-tracking-action="PT Zoom In" aria-label="Zoom In" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-zoom-in" aria-hidden="true"></i></button>
      <button href="{//ResizeLinks/ResizeOutLink}" id="action-zoom-out" type="button" class="btn square action-zoom-out" data-toggle="tracking" data-tracking-action="PT Zoom Out" aria-label="Zoom Out" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-zoom-out" aria-hidden="true"></i></button>
    </div>
  </xsl:template>

  <xsl:template name="action-view-button">
    <xsl:param name="view" />
    <xsl:param name="show-label" />
    <xsl:variable name="role">
      <xsl:choose>
        <xsl:when test="$show-label = 'TRUE'">x-tooltip</xsl:when>
        <xsl:otherwise>tooltip</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="options">
      <h:select>
        <h:option name="1up" value="icomoon icomoon-scroll">Scroll Page Scans</h:option>
        <h:option name="2up" value="icomoon icomoon-book-alt2">Flip Page Scans</h:option>
        <h:option name="thumb" value="icomoon icomoon-gridview">View Thumbnails</h:option>
        <h:option name="image" value="icomoon icomoon-documents">View Page by Page</h:option>
        <h:option name="plaintext" value="icomoon icomoon-article">View Plain Text</h:option>
      </h:select>
    </xsl:variable>

    <xsl:variable name="option" select="exsl:node-set($options)//h:option[@name=$view]" />
    <xsl:variable name="href" select="//ViewTypeLinks/View[@name=$view]" />
    <xsl:variable name="active">
      <xsl:choose>
        <xsl:when test="$view = $gCurrentView"> active</xsl:when>
        <xsl:otherwise />
      </xsl:choose>
    </xsl:variable>

    <button href="{$href}" data-target="{$option/@name}" type="button" class="action-view btn square" data-toggle="tooltip tracking" data-tracking-action="PT {$option}" aria-label="{$option}" data-microtip-position="left" data-microtip-size="small" data-role="{$role}">
      <xsl:if test="$option/@accesskey">
        <xsl:attribute name="accesskey"><xsl:value-of select="$option/@accesskey" /></xsl:attribute>
      </xsl:if>
      <xsl:if test="$view = $gCurrentView">
        <xsl:attribute name="aria-pressed">true</xsl:attribute>
      </xsl:if>
      <i class="{$option/@value}"></i>
      <xsl:if test="$show-label = 'TRUE'">
        <span aria-hidden="true"><xsl:value-of select="$option" /></span>
      </xsl:if>
    </button>
  </xsl:template>

  <xsl:template name="toolbar-horizontal">
    <div id="toolbar-horizontal" class="toolbar toolbar-horizontal" role="toolbar" aria-label="Volume Navigation">

      <h2 class="offscreen" id="view-heading">
        <xsl:text>View: Scroll Page Scans</xsl:text>
      </h2>

      <xsl:call-template name="action-go-page" />

      <div class="btn-group table-of-contents">
        <xsl:call-template name="action-table-of-contents" />
      </div>

      <!-- <div class="btn-group table-of-selections" id="selection-contents">
        <xsl:call-template name="action-selection-contents" />
      </div> -->

      <xsl:call-template name="action-search-volume" />

      <div class="btn-group">
        <xsl:call-template name="action-page-navigation" />
      </div>

    </div>
  </xsl:template>

  <xsl:template name="action-go-page">
    <xsl:variable name="pageNum">
      <xsl:choose>
        <xsl:when test="$gCurrentPageNum">
          <xsl:value-of select="$gCurrentPageNum" />
        </xsl:when>
        <xsl:otherwise>
          <!-- not making this visible -->
          <!-- <xsl:text>n</xsl:text><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" /> -->
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <form class="form-inline" method="get" action="pt" id="form-go-page">
      <label for="input-go-page">Jump to </label>
      <input id="input-go-page" name="num" type="text" placeholder="" value="{$pageNum}" class="input-mini" />
      <button id="action-go-page" type="submit" class="btn" data-toggle="tracking" data-tracking-action="PT Jump to Section">Go</button>
      <input type="hidden" name="u" value="1" />
      <xsl:apply-templates select="//PageXOfYForm/HiddenVars"/>
      <xsl:if test="not(//PageXOfYForm/HiddenVars/Variable[@name='seq'])">
        <input type="hidden" name="seq" value="" />
      </xsl:if>
      <xsl:call-template name="HiddenDebug"/>
    </form>
  </xsl:template>

  <xsl:template name="action-page-navigation">
    <button id="action-go-first" href="{//FirstPageLink}" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT First Page" aria-label="Go to first page scan" data-microtip-position="bottom" data-microtip-size="small" data-role="x-tooltip"><i class="icomoon icomoon-first"></i></button>
    <button id="action-go-prev" href="{//PreviousPageLink}" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Previous Page" aria-label="Go to previous page scan" data-microtip-position="bottom" data-microtip-size="small" data-role="x-tooltip"><i class="icomoon icomoon-go-previous"></i></button>
    <button id="action-go-next" href="{//NextPageLink}" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Next Page" aria-label="Go to next page scan" data-microtip-position="bottom" data-microtip-size="small" data-role="x-tooltip"><i class="icomoon icomoon-go-next"></i></button>
    <button id="action-go-last" href="{//LastPageLink}" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Last Page" aria-label="Go to last page scan" data-microtip-position="bottom" data-microtip-size="small" data-role="x-tooltip"><i class="icomoon icomoon-last"></i></button>
  </xsl:template>

  <xsl:template name="action-table-of-contents">
    <button type="button" class="btn dropdown-toggle square" data-toggle="dropdown" aria-label="Jump to section" data-microtip-position="bottom" data-microtip-size="small" data-role="tooltip">
      <i class="icomoon icomoon-list"></i><span class="caret"></span>
    </button>
    <ul class="dropdown-menu scrollable-list">
      <xsl:for-each select="$gFeatureList/Feature">
        <li>
          <a href="{Link}" data-seq="{Seq}">
            <xsl:value-of select="Label" />
            <xsl:if test="normalize-space(Page)">
              <xsl:text> - </xsl:text>
              <xsl:value-of select="Page" />
            </xsl:if>
          </a>
        </li>
      </xsl:for-each>
    </ul>
  </xsl:template>

  <xsl:template name="action-selection-contents">
    <button type="button" class="btn dropdown-toggle square disabled" data-toggle="dropdown" aria-label="Jump to selected page" data-microtip-position="bottom" data-microtip-size="small" data-role="tooltip">
      <i class="icomoon icomoon-copy"></i><span class="caret"></span>
      <span class="msg"></span>
    </button>
    <ul class="dropdown-menu scrollable-list selected-list"></ul>
  </xsl:template>

  <xsl:template name="page-content">
    <div id="content">
      <xsl:choose>
        <xsl:when test="$gFinalView = 'empty'">
          <xsl:call-template name="page-content-empty" />
        </xsl:when>
        <xsl:when test="$gFinalView = 'missing'">
          <xsl:call-template name="page-content-missing" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:choose>
            <xsl:when test="$gCurrentView = 'image'">
              <xsl:call-template name="page-content-image" />
            </xsl:when>
            <xsl:when test="$gCurrentView = 'plaintext'">
              <xsl:call-template name="page-content-plaintext" />
            </xsl:when>
            <xsl:otherwise>
              <xsl:call-template name="page-content-reader" />
            </xsl:otherwise>
          </xsl:choose>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="page-content-reader">
    <div class="page-item">
      <div class="alert alert-info alert-block startup">
        <p>Loading <em><xsl:value-of select="$gTitleString" /></em>. <img src="/pt/graphics/thumb-loader.gif" /></p>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="page-content-image">
    <xsl:variable name="seq" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
    <div class="page-item size-{//CurrentCgi/Param[@name='size']}" data-seq="{$seq}" id="page{$seq}">
      <div class="page-wrap">
        <img alt="image of individual page" src="{//CurrentPageImageSource}" />
      </div>
    </div>
  </xsl:template>

  <xsl:template name="page-content-plaintext">
    <xsl:variable name="seq" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
    <div class="page-item page-text loaded" data-seq="{$seq}" id="page{$seq}">
      <div class="page-wrap">
        <div class="page-inner">
          <p>
            <xsl:apply-templates select="//CurrentPageOcr" mode="copy-guts" />
          </p>
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="page-content-empty">
    <xsl:choose>
      <xsl:when test="$gHasOcr = 'YES'">
        <div class="alert alert-block alert-info alert-headline">
          <p>
            NO TEXT ON PAGE
          </p>
        </div>
        <p>
          This page does not contain any text recoverable by the OCR engine.
        </p>
      </xsl:when>
      <xsl:otherwise>
        <div class="alert alert-block alert-info alert-headline">
          <p>
            NO TEXT IN THIS ITEM
          </p>
        </div>
        <p>
          This item consists only of page images without any OCR text.
        </p>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="page-content-missing">
    <div class="alert alert-block alert-info alert-headline">
      <p>
        PAGE NOT AVAILABLE
      </p>

      <br />
      <a target="_blank" href="http://www.hathitrust.org/help_digital_library#PageNotAvailable" class="btn btn-primary">Learn more.</a>
    </div>
  </xsl:template>

  <xsl:template match="node()" mode="copy-guts">
    <xsl:apply-templates select="@*|*|text()" mode="copy" />
  </xsl:template>

  <xsl:template match="node()[name()]" mode="copy" priority="10">
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:element>
  </xsl:template>

  <xsl:template match="@*|*|text()" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>

