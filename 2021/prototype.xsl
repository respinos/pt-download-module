<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <!-- Global Variables -->
  <xsl:variable name="gOrphanCandidate" select="/MBooksTop/MBooksGlobals/OrphanCandidate"/>
  <!-- <xsl:variable name="gFinalAccessStatus" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/> -->
  <!-- <xsl:variable name="gCurrentQ1" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/> -->
  <xsl:variable name="gFeatureList" select="/MBooksTop/MdpApp/FeatureList"/>
  <xsl:variable name="gBackNavLinkType" select="/MBooksTop/MdpApp/BackNavInfo/Type"/>
  <xsl:variable name="gBackNavLinkHref" select="/MBooksTop/MdpApp/BackNavInfo/Href"/>
  <!-- <xsl:variable name="gSSD_Session" select="/MBooksTop/MBooksGlobals/SSDSession"/> -->
  <xsl:variable name="gUserName" select="/MBooksTop/Header/UserName"/>
  <xsl:variable name="gInCopyright" select="/MBooksTop/MBooksGlobals/InCopyright"/>
  <xsl:variable name="gHeld" select="/MBooksTop/MBooksGlobals/Holdings/Held"/>
  <xsl:variable name="gBrittleHeld" select="/MBooksTop/MBooksGlobals/Holdings/BrittleHeld"/>
  <xsl:variable name="gImgsrvUrlRoot" select="/MBooksTop/MBooksGlobals/UrlRoots/Variable[@name='cgi/imgsrv']"/>
  <xsl:variable name="gItemType" select="/MBooksTop/MBooksGlobals/ItemType" />
  <xsl:variable name="gHTDEV" select="/MBooksTop/MBooksGlobals/EnvHT_DEV"/>
  <xsl:variable name="gSuppressAccessBanner" select="/MBooksTop/MBooksGlobals/SuppressAccessBanner"/>

  <xsl:variable name="etas_href">https://www.hathitrust.org/ETAS-User-Information</xsl:variable>

  <xsl:variable name="gIsCRMS">
    <xsl:choose>
      <xsl:when test="contains(/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='skin'], 'crms')">true</xsl:when>
      <xsl:otherwise>false</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="load_concat_js_file" />
  <xsl:template name="load_uncompressed_js" />

  <xsl:template name="setup-extra-header">
    <meta name="robots" content="noarchive" />

    <link rel="stylesheet" type="text/css" href="/2021/dist/css/app.css" />

  </xsl:template>

  <xsl:template name="footer"></xsl:template>

  <xsl:template name="build-main-container">
    <main>
      <div class="app--header">
        <a class="text-link" href="/cgi/ssd?id={$gHtId}" data-role="tooltip" aria-label="Text-only view">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-file-text</xsl:with-param>
          </xsl:call-template>
        </a>
        <h1>
          <xsl:call-template name="BuildRDFaWrappedTitle">
            <xsl:with-param name="visible_title_string" select="$gTruncTitleString"/>
            <xsl:with-param name="hidden_title_string" select="$gFullTitleString"/>
          </xsl:call-template>
        </h1>
        <form>
          <div class="input-group-text">
            <label class="small" for="app--header--q1">Search in this text</label>
            <input type="text" class="form-control" name="q1" id="app--header--q1" />
            <button class="btn" aria-label="Search">
              <xsl:call-template name="build-pt-icon">
                <xsl:with-param name="id">bi-search</xsl:with-param>
              </xsl:call-template>
            </button>
          </div>
        </form>
      </div>

      <div class="app--main">
        <div class="app--panels">
          <div class="app--panels--list">
            <div class="app--panels--panel">
              <xsl:call-template name="build-panel-header">
                <xsl:with-param name="label">About this item</xsl:with-param>
              </xsl:call-template>              
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
              <p style="padding: 1rem; margin: 1rem; background: yellow; height: 8rem">PANEL</p>
            </div>
          </div>
        </div>
        <div class="app--viewer">
        </div>
      </div>


      <xsl:call-template name="build--app--toolbar"></xsl:call-template>

    </main>
    <script type="text/javascript" src="/2021/dist/js/main.js"></script>

  </xsl:template>

  <xsl:template name="build-panel-header">
    <xsl:param name="label" />
    <h2>
      <span><xsl:value-of select="$label" /></span>
      <button class="btn" data-action="close-panel">
        <span class="offscreen">Close Panel</span>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-x-circle</xsl:with-param>
        </xsl:call-template>
      </button>
    </h2>
  </xsl:template>

  <xsl:template name="build--app--toolbar">
    <xsl:variable name="currentSeq" select="//Param[@name='seq']" />
    <xsl:variable name="totalSeq" select="count(//METS:structMap[@TYPE='physical']/METS:div[@TYPE]/METS:div[@ORDER])" />
    <xsl:variable name="readingOrder" select="//Manifest/ReadingOrder" />

    <div class="app--toolbar">
      <div class="control--group">
        <sl-dropdown id="action-select-panel" hoist="true" placement="top">
          <sl-button class="dropup" slot="trigger" caret="true">
            <xsl:call-template name="build-pt-icon">
              <xsl:with-param name="id">bi-three-dots-vertical</xsl:with-param>
            </xsl:call-template>
            <span class="mq--hide--narrowest">Options</span>
          </sl-button>
          <sl-menu>
            <sl-menu-item>
              <span class="menu-item-option">About this item</span>
              <sl-icon slot="prefix" name="info-square"></sl-icon>
            </sl-menu-item>
            <sl-menu-item>
              <span class="menu-item-option">Search in this book</span>
              <sl-icon slot="prefix" name="search"></sl-icon>
            </sl-menu-item>
            <sl-menu-item>
              <span class="menu-item-option">Contents</span>
              <sl-icon slot="prefix" name="list"></sl-icon>
            </sl-menu-item>
            <sl-menu-item>
              <span class="menu-item-option">Download</span>
              <sl-icon slot="prefix" name="download"></sl-icon>
            </sl-menu-item>
            <sl-menu-item>
              <span class="menu-item-option">Share</span>
              <sl-icon slot="prefix" name="share-fill"></sl-icon>
            </sl-menu-item>
            <sl-menu-item>
              <span class="menu-item-option">Bookmark</span>
              <sl-icon slot="prefix" name="bookmark"></sl-icon>
            </sl-menu-item>
          </sl-menu>
        </sl-dropdown>
      </div>
      <xsl:call-template name="build-reader-toolbar-navigator">
        <xsl:with-param name="currentSeq" select="$currentSeq" />
        <xsl:with-param name="totalSeq" select="$totalSeq" />
        <xsl:with-param name="readingOrder" select="$readingOrder" />
      </xsl:call-template>
      <div class="control-group grouped">
        <button class="btn" data-action="action-zoom-in">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-plus-circle</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" data-action="action-zoom-out">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-minus-circle</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" data-action="action-fullscreent">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-arrows-fullscreen</xsl:with-param>
          </xsl:call-template>
        </button>
      </div>
      <div class="control-group">
        <sl-dropdown id="action-select-view" hoist="true" placement="top">
          <sl-button class="dropup" slot="trigger" caret="true">
            <xsl:call-template name="build-pt-icon">
              <xsl:with-param name="id">bi-files</xsl:with-param>
            </xsl:call-template>
            <span class="mq--hide--narrowest">View</span>
          </sl-button>
          <sl-menu>
            <sl-menu-item>
              <span class="menu-item-option">Scroll Page Scans</span>
              <sl-icon slot="prefix" name="files"></sl-icon>
            </sl-menu-item>
            <sl-menu-item>
              <span class="menu-item-option">Flip Page Scans</span>
              <sl-icon slot="prefix" name="book"></sl-icon>
            </sl-menu-item>
            <sl-menu-item>
              <span class="menu-item-option">Browse Thumbnails</span>
              <sl-icon slot="prefix" name="grid"></sl-icon>
            </sl-menu-item>
            <sl-menu-item>
              <span class="menu-item-option">View Page Scan by Page Scan</span>
              <sl-icon slot="prefix" name="file-image"></sl-icon>
            </sl-menu-item>
            <sl-menu-item>
              <span class="menu-item-option">View Plain Text</span>
              <sl-icon slot="prefix" name="file-text"></sl-icon>
            </sl-menu-item>
          </sl-menu>
        </sl-dropdown>
      </div>
      <div class="control-group grouped">
        <button class="btn" data-action="action-go-previous">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-arrow-left-circle</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" data-action="action-go-next">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-arrow-right-circle</xsl:with-param>
          </xsl:call-template>
        </button>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-reader-toolbar-navigator">
    <xsl:param name="currentSeq" />
    <xsl:param name="totalSeq" />
    <xsl:param name="readingOrder" />

    <form class="app--reader--navigator" style="flex-grow: 0.5">
      <div class="navigator-range-wrap">
        <input class="navigator-range" type="range" min="1" max="{$totalSeq}" value="{$currentSeq}">
          <xsl:if test="$readingOrder = 'right-to-left'">
            <xsl:attribute name="dir">rtl</xsl:attribute>
          </xsl:if>
        </input>
      </div>
      <div class="navigator-output">
        <!-- <span data-slot="seq">15</span> -->
        <span>#</span>
        <input type="text" name="navigator-input-seq" value="{$currentSeq}">
          <xsl:attribute name="size">
            <xsl:value-of select="string-length($totalSeq)" />
          </xsl:attribute>
        </input>
        <span> / </span>
        <span data-slot="total-seq"><xsl:value-of select="$totalSeq" /></span>
      </div>
      <!-- <button id="action-prompt-seq" class="btn">
        <span>Jump...</span>
      </button> -->

      <button tabindex="-1" id="action-focus-current-page" aria-hidden="true" style="display: none" accesskey="9">Show Current Page</button>
      <button tabindex="-1" id="action-proxy-navigation-f" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="f" data-target="action-go-first">Go First</button>
      <button tabindex="-1" id="action-proxy-navigation-p" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="p" data-target="action-go-prev">Go Previous</button>
      <button tabindex="-1" id="action-proxy-navigation-x" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="x" data-target="action-go-next">Go Next</button>
      <button tabindex="-1" id="action-proxy-navigation-n" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="n" data-target="action-go-next">Go Next</button>
      <button tabindex="-1" id="action-proxy-navigation-l" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="l" data-target="action-go-last">Go Last</button>

    </form>
  </xsl:template>

  <xsl:template name="setup-html-attributes">
    <xsl:variable name="ns">
      <dc:elem xmlns:dc="http://purl.org/dc/elements/1.1/" />
      <cc:elem xmlns:cc="http://creativecommons.org/ns#" />
      <foaf:elem xmlns:foaf="http://xmlns.com/foaf/0.1" />
    </xsl:variable>
    <xsl:copy-of select="exsl:node-set($ns)/*/namespace::*" />
    <xsl:attribute name="version">XHTML+RDFa 1.0</xsl:attribute>
    <xsl:attribute name="data-content-provider"><xsl:value-of select="/MBooksTop/MBooksGlobals/ContentProvider" /></xsl:attribute>
    <xsl:if test="//CurrentCgi/Param[@name='page'] = 'root' and //FinalAccessStatus = 'allow'">
      <xsl:attribute name="data-analytics-skip">true</xsl:attribute>
    </xsl:if>
    <xsl:attribute name="data-app">pt</xsl:attribute>
    <xsl:call-template name="setup-extra-html-attributes" />
  </xsl:template>

  <xsl:template name="setup-body-data-attributes">
    <xsl:attribute name="data-panel-state">closed</xsl:attribute>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="suffix">
        <xsl:call-template name="get-title-suffix" />
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="get-title-suffix">
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template>

  <xsl:template name="get-tracking-category">PT</xsl:template>

  <xsl:template name="setup-extra-html-attributes"></xsl:template>

</xsl:stylesheet>