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

  <xsl:param name="view" />
  <xsl:param name="prototype">panels</xsl:param>
  <xsl:param name="ts">0</xsl:param>

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

    <link rel="stylesheet" type="text/css" href="/2021/dist/css/app.css?_={$ts}" />

  </xsl:template>

  <!-- <xsl:template name="footer"></xsl:template> -->

  <xsl:template name="build-main-container">
    <xsl:choose>
      <xsl:when test="$prototype = 'panels'">
        <xsl:call-template name="build-main-container-panels" />
      </xsl:when>
      <xsl:when test="$prototype = 'stacked'">
        <xsl:call-template name="build-main-container-stacked" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="build-main-container-default" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-main-container-stacked">
    <main data-prototype="stacked">
      <xsl:if test="$view != 'restricted'">
        <div class="stacked--reader">
          <div class="stacked--search">
            <form>
              <div class="input-group-text">
                <label class="small" for="app--header--q1">Search in this text</label>
                <input type="text" class="form-control" name="q1" id="app--header--q1" />
                <button class="btn" aria-label="Search" id="action-search-volume">
                  <xsl:call-template name="build-pt-icon">
                    <xsl:with-param name="id">bi-search</xsl:with-param>
                  </xsl:call-template>
                </button>
              </div>
            </form>
          </div>
          <div class="stacked--panels">
            <div class="stacked--panel">
              <xsl:call-template name="build-panel-header">
                <xsl:with-param name="label">Search results</xsl:with-param>
              </xsl:call-template>              
              <xsl:call-template name="build-search-results" />
            </div>
          </div>
          <div class="stacked--viewer">
            <div class="page"></div>
            <div class="page"></div>
          </div>
          <xsl:call-template name="build-stacked-toolbar" />
        </div>
      </xsl:if>
      <div class="stacked--main">
        <div class="stacked--main--metadata">
          <h1 style="font-size: 1.2rem">
            <xsl:call-template name="BuildRDFaWrappedTitle">
              <xsl:with-param name="visible_title_string" select="$gTruncTitleString"/>
              <xsl:with-param name="hidden_title_string" select="$gFullTitleString"/>
            </xsl:call-template>
          </h1>

          <p style="margin: 1rem 0;">
            <a class="text-link" href="/cgi/ssd?id={$gHtId}" style="display: inline-flex; align-items: center; color: #924a0b;">
              <xsl:call-template name="build-pt-icon">
                <xsl:with-param name="id">bi-file-text</xsl:with-param>
              </xsl:call-template>
              <span style="display: inline-block; margin-left: 0.5rem">View Text-Only Rendition</span>
            </a>
          </p>

          <xsl:variable name="tmp-xml">
            <div>
              <xsl:call-template name="BuildRDFaWrappedAuthor"/>
              <xsl:call-template name="BuildRDFaWrappedPublished"/>
              <xsl:call-template name="BuildRDFaWrappedDescription" />
            </div>
          </xsl:variable>
          <xsl:variable name="tmp" select="exsl:node-set($tmp-xml)" />
          <dl class="metadata">
            <xsl:for-each select="$tmp//xhtml:span">
              <dt><xsl:value-of select="@property" /></dt>
              <dd><xsl:value-of select="@content" /></dd>
            </xsl:for-each>
          </dl>

          <p>
            <xsl:variable name="record_no">
              <xsl:value-of select="$gCatalogRecordNo"/>
            </xsl:variable>
            <xsl:choose>
              <xsl:when test="$record_no!=''">
                <xsl:element name="a">
                  <xsl:variable name="href">
                    <xsl:text>https://catalog.hathitrust.org/Record/</xsl:text>
                    <xsl:value-of select="$record_no"/>
                  </xsl:variable>
                  <xsl:attribute name="data-toggle">tracking</xsl:attribute>
                  <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
                  <xsl:attribute name="data-tracking-action">PT VuFind Catalog Record</xsl:attribute>
                  <xsl:attribute name="data-tracking-label"><xsl:value-of select="$href" /></xsl:attribute>
                  <xsl:attribute name="href"><xsl:value-of select="$href" /></xsl:attribute>
                  <!-- <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute> -->
                  <xsl:text>View full catalog record</xsl:text>
                </xsl:element>
              </xsl:when>
              <xsl:otherwise>
                <xsl:call-template name="display-catalog-record-not-available" />
              </xsl:otherwise>
            </xsl:choose>
          </p>
          <h3 style="border-bottom: none; font-size: 0.9rem; padding-bottom: 0; margin-top: 0.5rem; margin-bottom: 0">Rights</h3>
          <p class="smaller" style="margin-top: 0.25rem; margin-bottom: 0">
            <xsl:call-template name="BuildRDFaCCLicenseMarkup" />
          </p>

        </div>
        <div class="stacked--main--options">
          <div class="stacked--option">
            <xsl:call-template name="download-this-book" />
          </div>
        </div>
      </div>
    </main>
    <script type="text/javascript" src="/2021/dist/js/main.js?_={$ts}"></script>
  </xsl:template>

  <xsl:template name="build-stacked-toolbar">
    <xsl:variable name="currentSeq" select="//Param[@name='seq']" />
    <xsl:variable name="totalSeq" select="count(//METS:structMap[@TYPE='physical']/METS:div[@TYPE]/METS:div[@ORDER])" />
    <xsl:variable name="readingOrder" select="//Manifest/ReadingOrder" />

    <div class="stacked--toolbar">
      <xsl:call-template name="build-reader-toolbar-navigator">
        <xsl:with-param name="currentSeq" select="$currentSeq" />
        <xsl:with-param name="totalSeq" select="$totalSeq" />
        <xsl:with-param name="readingOrder" select="$readingOrder" />
        <xsl:with-param name="drawControls" select="true()" />
      </xsl:call-template>
      <div class="control-group">
        <div class="control-group grouped hide--mobile">
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
        <div class="control-group hide--mobile">
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
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-main-container-panels">
    <main data-prototype="panels">
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
          <xsl:choose>
            <xsl:when test="$view = 'restricted'">
              <div class="info">
                <xsl:variable name="find-in-library-link">
                  <xsl:call-template name="FindInALibraryLink">
                    <xsl:with-param name="class"> inline</xsl:with-param>
                    <xsl:with-param name="label">find this item in a library</xsl:with-param>
                  </xsl:call-template>
                </xsl:variable>
                <div class="alert alert-info alert-block">
                  This item is <strong>not available online</strong> (<i class="icomoon icomoon-locked"></i> Limited - search only) due to copyright restrictions. <a href="https://www.hathitrust.org/help_copyright#RestrictedAccess">Learn More »</a>
                </div>

                <!-- <div style="margin-bottom: 2rem;">
                  <xsl:call-template name="action-search-volume" />
                </div> -->

                <div>
                  <p>
                    <xsl:text>You can </xsl:text>
                    <xsl:if test="exsl:node-set($find-in-library-link)//node()">
                      <xsl:text>try to </xsl:text>
                      <xsl:apply-templates select="exsl:node-set($find-in-library-link)" mode="copy" />
                      <xsl:text> or </xsl:text>
                    </xsl:if>
                    <strong>search in this text</strong><xsl:text> to find the frequency and page number of specific words and phrases. This can be especially useful to help you decide if the book is worth buying, checking out from a library, etc.</xsl:text>
                  </p>
                </div>                  
              </div>
            </xsl:when>
            <xsl:otherwise>
              <div class="page"></div>
              <div class="page"></div>
            </xsl:otherwise>
          </xsl:choose>
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
            <sl-menu-divider class="mq--mobile"></sl-menu-divider>
            <sl-menu-item class="mq--mobile">
              <span class="menu-item-option">Configure View</span>
              <sl-icon slot="prefix" name="files"></sl-icon>
            </sl-menu-item>
            <sl-menu-item class="mq--mobile">
              <span class="menu-item-option">Configure Zoom</span>
              <sl-icon slot="prefix" name="plus-circle"></sl-icon>
            </sl-menu-item>
          </sl-menu>
        </sl-dropdown>
      </div>
      <xsl:choose>
        <xsl:when test="$view = 'restricted'"></xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="build-reader-toolbar-navigator">
            <xsl:with-param name="currentSeq" select="$currentSeq" />
            <xsl:with-param name="totalSeq" select="$totalSeq" />
            <xsl:with-param name="readingOrder" select="$readingOrder" />
          </xsl:call-template>
          <div class="control-group grouped hide--mobile">
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
          <div class="control-group hide--mobile">
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
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="build-reader-toolbar-navigator">
    <xsl:param name="currentSeq" />
    <xsl:param name="totalSeq" />
    <xsl:param name="readingOrder" />
    <xsl:param name="drawControls" />

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

      <xsl:if test="$drawControls">
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
      </xsl:if>

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
    <xsl:attribute name="data-panel-state">
      <xsl:choose>
        <xsl:when test="$view = 'restricted'">open</xsl:when>
        <xsl:otherwise>closed</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-prototype"><xsl:value-of select="$prototype" /></xsl:attribute>
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

  <xsl:template name="build-search-results">
    <div class="results-container">
      <div class="alert alert-info alert-block">
        <p>Showing 1 - 10 of 166 Results for <span class="mdpEmp">heaven</span></p>
      </div>

                        
      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=65;start=1;sz=10;page=search" data-seq="65">Page 0</a>&#160;-&#160;9&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic>is in 
            <strong class="solr_highlight_1">heaven</strong>, 
           and from which 
            <strong class="solr_highlight_1">heaven</strong> itself is. This is also called Divine, 
           because from the Lord ; for the Lord, or what is the same, 
           the Divine, which is from the Lord alone, is the all in all 
           of 
            <strong class="solr_highlight_1">heaven</strong> ; whatever is not from the Divine there, is not 
           of 
            <strong class="solr_highlight_1">heaven</strong>. For this reason it has been
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>ng to 
            <strong class="solr_highlight_1">heaven</strong>. That this sig- 
           nifies with the Divine, namely, that there was communica- 
           tion therewith, is evident from the signification of the head, . 
           or summit of the ladder, as what is supreme ; and from the 
           signification of 
            <strong class="solr_highlight_1">heaven</strong>, as the Divine ; for 
            <strong class="solr_highlight_1">heaven</strong>, in the 
           supreme sense, in w
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>rd is 
            <strong class="solr_highlight_1">heaven</strong> itself, and that all who are in 
           
            <strong class="solr_highlight_1">heaven</strong> are in the Lord. 
           
           3701. And behold the angels of God ascending and de- 
           scending upon it That this signifies infinite and eternal 
           communication and thence conjunction ; and that from what 
           is lowest there is as it were an ascent, and after
          </kwic>...
        </p>
      </article>
      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=543;start=1;sz=10;page=search" data-seq="543">Page 0</a>&#160;-&#160;7&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic>n his 
            <strong class="solr_highlight_1">heaven</strong> is in his Kfe, 
           and has influx from the universal 
            <strong class="solr_highlight_1">heaven</strong>, every one being 
           the centre of all influxes, and thus in the most perfect equi- 
           librium, and this according to the stupendous form of 
           
            <strong class="solr_highlight_1">heaven</strong>, which is from the Lord alone, and thus with all 
           variety. 
           
           4226. Spirits rece
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic> into 
            <strong class="solr_highlight_1">heaven</strong> ; for they had no other notion about 
            <strong class="solr_highlight_1">heaven</strong> 
           than that of admission from favor. But it has sometimes 
           been answered them, that 
            <strong class="solr_highlight_1">heaven</strong> is denied to no one ; and 
           that if they earnestly desire it, they will be admitted. 
           Some have also been admitted into the heavenly societies 
           which
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic> that 
            <strong class="solr_highlight_1">heaven</strong> to them 
           was hell, and such as they had never believed. 
           
           4227. There are many of both sexes who have been of 
           such character in the life of the body, that whenever they 
           could they sought by art and deceit to subjugate the minds 
           of others to themselves, with the end of ruling ov
          </kwic>...
        </p>
      </article>

      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=53;start=1;sz=10;page=search" data-seq="53">Page 0</a>&#160;-&#160;6&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic>t one 
            <strong class="solr_highlight_1">heaven</strong> is more interior than another, and that 
           the third 
            <strong class="solr_highlight_1">heaven</strong> is inmost. These heavens are most dis- 
           tinct from each other according to degrees. They who are 
           in the inmost or third 
            <strong class="solr_highlight_1">heaven</strong>, are nearest to the Lord ; 
           they who are in the interior or second 
            <strong class="solr_highlight_1">heaven</strong>, are more 
           remote ; an
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>first 
            <strong class="solr_highlight_1">heaven</strong>, 
           are still more remote. No other communication between 
           these heavens can be given than such as that of man's in- 
           mosts with his exteriors ; for the man who is in love to the 
           Lord and in charity toward his neighbor, is a little 
            <strong class="solr_highlight_1">heaven</strong>, 
           corresponding in form to the three heavens
          </kwic>...
        </p>
      </article>
      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=270;start=1;sz=10;page=search" data-seq="270">Page 0</a>&#160;-&#160;6&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic>erior 
            <strong class="solr_highlight_1">heaven</strong> was opened to me, 
           and I was conversing with angels there, I was permitted to 
           observe what follows. It is to be known that although I 
           was in 
            <strong class="solr_highlight_1">heaven</strong>, still I was not out of myself, but in the 
           body, for 
            <strong class="solr_highlight_1">heaven</strong> is in man, in whatever place he be, and 
           thus, when it pleases the Lord
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>be in 
            <strong class="solr_highlight_1">heaven</strong> 
           and yet not be withdrawn from the body. Thus it was 
           given me to perceive the general operations of 
            <strong class="solr_highlight_1">heaven</strong> as 
           manifestly as an object is perceived by any of the senses. 
           There were four operations which I then perceived. The 
           first was into the brain at the left temple, and was a
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>lf of 
            <strong class="solr_highlight_1">heaven</strong> was then mani- 
           festly perceived by me. It is internal, and for that reason 
           imperceptible to man ; but by a wonderful correspondence 
           it flows into man's respiration, which is external, or of the 
           body, and if man were deprived of this influx, he would 
           
           3 instantly fall down dea
          </kwic>...
        </p>
      </article>

      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=271;start=1;sz=10;page=search" data-seq="271">Page 0</a>&#160;-&#160;6&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic> that 
            <strong class="solr_highlight_1">heaven</strong>, or the 
           Greatest Man, has cardiac pulses, and that it has respira- 
           tions ; and that the cardiac pulses of 
            <strong class="solr_highlight_1">heaven</strong>, or the Great- 
           est Man, have correspondence with the heart and with its 
           systolic and diastolic motions, and that the respirations of 
           
            <strong class="solr_highlight_1">heaven</strong>, or the Greatest Man, ha
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic> in 
            <strong class="solr_highlight_1">heaven</strong> with my head, but not 
           with my body. In this state, also, it was given me to ob- 
           serve the general respiration of 
            <strong class="solr_highlight_1">heaven</strong>, and what its nature 
           was ; it was interior, easy, spontaneous, and corresponding 
           to my respiration as three to one. It was also given me to 
           observe the recipro
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>ht of 
            <strong class="solr_highlight_1">heaven</strong> there is spiritual life (see 
           n. 1524, 2776, 3167, 3195, 3339, 3636, 3643). When I 
           was in this light, corporeal and worldly things appeared as 
           beneath me, and nevertheless I still perceived them, but as 
           more remote from me, and not belonging to me. I then 
           seemed to myself to be
          </kwic>...
        </p>
      </article>
      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=324;start=1;sz=10;page=search" data-seq="324">Page 0</a>&#160;-&#160;6&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic> into 
            <strong class="solr_highlight_1">heaven</strong>. I have 
           at times spoken with those who have so hved, and have so 
           believed. When they come into the other life, they at first 
           have no other idea than that they may enter into 
            <strong class="solr_highlight_1">heaven</strong>, 
           paying no attention to their past life, in which they had put 
           on the enjoyment of affection for
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic> into 
            <strong class="solr_highlight_1">heaven</strong>, because 
            <strong class="solr_highlight_1">heaven</strong> is denied by the Lord to no 
           one ; but whether they can live there, they will be able to 
           learn if they are admitted. Some who firmly believed this, 
           were also admitted. But as the life there is that of love 
           to the Lord and the neighbor, which makes all the sphere 
          
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>ersal 
            <strong class="solr_highlight_1">heaven</strong>, and 
           makes the blessedness and happiness there ; and if you are 
           willing to believe it, it makes the intelligence and wisdom 
           also, with their enjoyments ; for into the enjoyments of 
           charity the Lord flows with the light of truth and the flame 
           of good, and with intelligence and 
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>was 
           
            <strong class="solr_highlight_1">heaven</strong> which to them was hell. From this it is manifest 
           what is the nature of the one enjoyment, and what is that 
           of the other ; and that they who are in the enjoyment of 
           
           
          </kwic>...
        </p>
      </article>                  
                  
      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=505;start=1;sz=10;page=search" data-seq="505">Page 0</a>&#160;-&#160;6&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic>whole 
            <strong class="solr_highlight_1">heaven</strong> ; and as 
            <strong class="solr_highlight_1">heaven</strong> 
           then consisted for the greatest part of the celestial, that is, 
           of those who were in the good of love, by means of that 
           influx, by the Divine Omnipotence the light which was in 
           the heavens was produced, and thereby wisdom and intelli- 
           gence. But after the human
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>ersal 
            <strong class="solr_highlight_1">heaven</strong> and the universal world. He had 
           been the Light Itself from eternity, for that Light was from 
           the Divine Itself through 
            <strong class="solr_highlight_1">heaven</strong>. And it was the Divine 
           Itself which took on the human, and made this Divine ; and 
           when this was made Divine, He could then thereby illumi- 
           nate not onl
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>rough 
            <strong class="solr_highlight_1">heaven</strong>, nor, consequently, wisdom 
           and intelligence which would penetrate down to the human 
           race. For this cause, from the necessity of their being 
           saved, the Lord came into the world, and made the Human 
           in Himself Divine, in order that as to His Divine Human 
           He might become the Divin
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>stial 
            <strong class="solr_highlight_1">heaven</strong> itself, but also the spiritual 
           
           
          </kwic>...
        </p>
      </article>
      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=108;start=1;sz=10;page=search" data-seq="108">Page 0</a>&#160;-&#160;5&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic>ht of 
            <strong class="solr_highlight_1">heaven</strong> ; for in the light 
           of 
            <strong class="solr_highlight_1">heaven</strong> there is wisdom and intelligence from the Lord 
           (see n. 3636, 3643) ; wherefore when those things which 
           are of the hght of the world are obliterated or wiped away, 
           there remain those which are of the light of 
            <strong class="solr_highlight_1">heaven</strong> ; thus 
           instead of terrestrial the
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>re in 
            <strong class="solr_highlight_1">heaven</strong>, or according to ideas 
           thence derived. The former and the latter things stand 
           related as things which are in the Ught of the world to 
           things which are in the light of 
            <strong class="solr_highlight_1">heaven</strong> ; the things which 
           are in the light of the world are dead in comparison with 
           the things which are in th
          </kwic>...
        </p>
      </article>
      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=127;start=1;sz=10;page=search" data-seq="127">Page 0</a>&#160;-&#160;5&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic>nmost 
            <strong class="solr_highlight_1">heaven</strong>, which 
           is the 
            <strong class="solr_highlight_1">heaven</strong> of innocence and peace, where those who 
           are celestial dwell ; which 
            <strong class="solr_highlight_1">heaven</strong>, because nearest to the 
           Lord, is called His likeness. The next 
            <strong class="solr_highlight_1">heaven</strong>, namely, 
           that which succeeds and is in an inferior degree, is an im- 
           age of the Lord, because in this 
            <strong class="solr_highlight_1">heaven</strong>, a
          </kwic>...
        </p>
      </article>
      <article class="result">
        <h3 class="results-header">
          <a href="/cgi/pt?q1=heaven;id=coo1.ark%3A%2F13960%2Ft9k36cp3t;view=1up;seq=128;start=1;sz=10;page=search" data-seq="128">Page 0</a>&#160;-&#160;5&#160;matching terms
        </h3>
        <p class="kwic">...
          <kwic>erior 
            <strong class="solr_highlight_1">heaven</strong>. The last 
            <strong class="solr_highlight_1">heaven</strong>, which succeeds this 
           again, is similarly placed, for the particular and singular 
           things of the next superior 
            <strong class="solr_highlight_1">heaven</strong> flow into this 
            <strong class="solr_highlight_1">heaven</strong>, 
           and are therein presented in general, and in correspondent 
           form. The case is similar with man, for he was created 
           and for
          </kwic>...
        </p>
        <p class="kwic">...
          <kwic>ces 
           
            <strong class="solr_highlight_1">heaven</strong> on high, when yet it is in what is internal. 
           
           3740. And all that Thou shall give me, tithing I will 
           tithe it to Thee. That this signifies that He made all things 
           whatsoever Divine by His own power, is evident from the 
           signification of giving, when predicated of the Lord, as 
           t
          </kwic>...
        </p>
      </article>                  
    </div>
  </xsl:template>

</xsl:stylesheet>